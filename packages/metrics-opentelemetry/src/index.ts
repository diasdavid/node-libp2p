/**
 * @packageDocumentation
 *
 * Uses [OpenTelemetry](https://opentelemetry.io/) to store metrics and method
 * traces in libp2p.
 *
 * @example Node.js
 *
 * Use with [OpenTelemetry Desktop Viewer](https://github.com/CtrlSpice/otel-desktop-viewer):
 *
 * ```ts
 * import { createLibp2p } from 'libp2p'
 * import { openTelemetryMetrics } from '@libp2p/opentelemetry-metrics'
 * import { PrometheusExporter } from '@opentelemetry/exporter-prometheus'
 * import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
 * import { NodeSDK } from '@opentelemetry/sdk-node'
 *
 * const sdk = new NodeSDK({
 *   traceExporter: new OTLPTraceExporter({
 *     url: 'http://127.0.0.1:4318/v1/traces'
 *   }),
 *   metricReader: new PrometheusExporter({
 *     port: 9464
 *   }),
 *   serviceName: 'my-app'
 * })
 * sdk.start()
 *
 * const node = await createLibp2p({
 *   // ... other options
 *   metrics: openTelemetryMetrics()
 * })
 * ```
 */

import { InvalidParametersError, serviceCapabilities } from '@libp2p/interface'
import { trace, metrics, context, SpanStatusCode } from '@opentelemetry/api'
import each from 'it-foreach'
import { OpenTelemetryCounterGroup } from './counter-group.js'
import { OpenTelemetryCounter } from './counter.js'
import { OpenTelemetryHistogramGroup } from './histogram-group.js'
import { OpenTelemetryHistogram } from './histogram.js'
import { OpenTelemetryMetricGroup } from './metric-group.js'
import { OpenTelemetryMetric } from './metric.js'
import { OpenTelemetrySummaryGroup } from './summary-group.js'
import { OpenTelemetrySummary } from './summary.js'
import { collectSystemMetrics } from './system-metrics.js'
import type { MultiaddrConnection, Stream, Connection, Metric, MetricGroup, Metrics, CalculatedMetricOptions, MetricOptions, Counter, CounterGroup, Histogram, HistogramOptions, HistogramGroup, Summary, SummaryOptions, SummaryGroup, CalculatedHistogramOptions, CalculatedSummaryOptions, NodeInfo, TraceFunctionOptions, TraceGeneratorFunctionOptions, TraceAttributes } from '@libp2p/interface'
import type { Span, Attributes } from '@opentelemetry/api'
import type { Duplex } from 'it-stream-types'

// see https://betterstack.com/community/guides/observability/opentelemetry-metrics-nodejs/#prerequisites

export interface OpenTelemetryComponents {
  nodeInfo: NodeInfo
}

export interface OpenTelemetryMetricsInit {
  /**
   * The app name used to create the tracer
   *
   * @default 'js-libp2p'
   */
  appName?: string

  /**
   * The app version used to create the tracer.
   *
   * The version number of the running version of libp2p is used as the default.
   */
  appVersion?: string

  /**
   * On Node.js platforms the current filesystem usage is reported as the metric
   * `nodejs_fs_usage_bytes` using the `statfs` function from `node:fs` - the
   * default location to stat is the current working directory, configured this
   * location here
   */
  statfsLocation?: string

  /**
   * The meter name used for creating metrics
   *
   * @default 'js-libp2p'
   */
  meterName?: string
}

class OpenTelemetryMetrics implements Metrics {
  private transferStats: Map<string, number>
  private readonly tracer: ReturnType<typeof trace.getTracer>
  private readonly meterName: string

  constructor (components: OpenTelemetryComponents, init?: OpenTelemetryMetricsInit) {
    this.tracer = trace.getTracer(init?.appName ?? components.nodeInfo.name, init?.appVersion ?? components.nodeInfo.version)

    // holds global and per-protocol sent/received stats
    this.transferStats = new Map()
    this.meterName = init?.meterName ?? components.nodeInfo.name

    this.registerCounterGroup('libp2p_data_transfer_bytes_total', {
      label: 'protocol',
      calculate: () => {
        const output: Record<string, number> = {}

        for (const [key, value] of this.transferStats.entries()) {
          output[key] = value
        }

        // reset counts for next time
        this.transferStats = new Map()

        return output
      }
    })

    collectSystemMetrics(this, init)
  }

  readonly [Symbol.toStringTag] = '@libp2p/metrics-opentelemetry'

  readonly [serviceCapabilities]: string[] = [
    '@libp2p/metrics'
  ]

  /**
   * Increment the transfer stat for the passed key, making sure
   * it exists first
   */
  _incrementValue (key: string, value: number): void {
    const existing = this.transferStats.get(key) ?? 0

    this.transferStats.set(key, existing + value)
  }

  /**
   * Override the sink/source of the stream to count the bytes
   * in and out
   */
  _track (stream: Duplex<AsyncGenerator<any>>, name: string): void {
    const self = this

    const sink = stream.sink
    stream.sink = async function trackedSink (source) {
      await sink(each(source, buf => {
        self._incrementValue(`${name} sent`, buf.byteLength)
      }))
    }

    const source = stream.source
    stream.source = each(source, buf => {
      self._incrementValue(`${name} received`, buf.byteLength)
    })
  }

  trackMultiaddrConnection (maConn: MultiaddrConnection): void {
    this._track(maConn, 'global')
  }

  trackProtocolStream (stream: Stream, connection: Connection): void {
    if (stream.protocol == null) {
      // protocol not negotiated yet, should not happen as the upgrader
      // calls this handler after protocol negotiation
      return
    }

    this._track(stream, stream.protocol)
  }

  registerMetric (name: string, opts: CalculatedMetricOptions): void
  registerMetric (name: string, opts?: MetricOptions): Metric
  registerMetric (name: string, opts: CalculatedMetricOptions | MetricOptions = {}): any {
    if (name == null || name.trim() === '') {
      throw new InvalidParametersError('Metric name is required')
    }

    const meter = metrics.getMeterProvider().getMeter(this.meterName)

    if (isCalculatedMetricOptions<CalculatedMetricOptions>(opts)) {
      const calculate = opts.calculate
      const counter = meter.createObservableGauge(name, {
        description: opts?.help ?? name
      })
      counter.addCallback(async (result) => {
        result.observe(await calculate())
      })

      return
    }

    return new OpenTelemetryMetric(meter.createGauge(name, {
      description: opts?.help ?? name
    }))
  }

  registerMetricGroup (name: string, opts: CalculatedMetricOptions<Record<string, number>>): void
  registerMetricGroup (name: string, opts?: MetricOptions): MetricGroup
  registerMetricGroup (name: string, opts: CalculatedMetricOptions | MetricOptions = {}): any {
    if (name == null || name.trim() === '') {
      throw new InvalidParametersError('Metric name is required')
    }

    const meter = metrics.getMeterProvider().getMeter(this.meterName)
    const label = opts?.label ?? name

    if (isCalculatedMetricOptions<CalculatedMetricOptions<Record<string, number>>>(opts)) {
      const calculate = opts.calculate
      const gauge = meter.createObservableGauge(name, {
        description: opts?.help ?? name
      })
      gauge.addCallback(async (observable) => {
        const observed = await calculate()

        for (const [key, value] of Object.entries(observed)) {
          observable.observe(value, {
            [label]: key
          })
        }
      })

      return
    }

    return new OpenTelemetryMetricGroup(label, meter.createGauge(name, {
      description: opts?.help ?? name
    }))
  }

  registerCounter (name: string, opts: CalculatedMetricOptions): void
  registerCounter (name: string, opts?: MetricOptions): Counter
  registerCounter (name: string, opts: CalculatedMetricOptions | MetricOptions = {}): any {
    if (name == null || name.trim() === '') {
      throw new InvalidParametersError('Metric name is required')
    }

    const meter = metrics.getMeterProvider().getMeter(this.meterName)

    if (isCalculatedMetricOptions<CalculatedMetricOptions>(opts)) {
      const calculate = opts.calculate
      const counter = meter.createObservableCounter(name, {
        description: opts?.help ?? name
      })
      counter.addCallback(async (result) => {
        result.observe(await calculate())
      })

      return
    }

    return new OpenTelemetryCounter(meter.createCounter(name, {
      description: opts?.help ?? name
    }))
  }

  registerCounterGroup (name: string, opts: CalculatedMetricOptions<Record<string, number>>): void
  registerCounterGroup (name: string, opts?: MetricOptions): CounterGroup
  registerCounterGroup (name: string, opts: CalculatedMetricOptions | MetricOptions = {}): any {
    if (name == null || name.trim() === '') {
      throw new InvalidParametersError('Metric name is required')
    }

    const meter = metrics.getMeterProvider().getMeter(this.meterName)
    const label = opts?.label ?? name

    if (isCalculatedMetricOptions<CalculatedMetricOptions<Record<string, number>>>(opts)) {
      const values: Record<string, number> = {}
      const calculate = opts.calculate
      const counter = meter.createObservableGauge(name, {
        description: opts?.help ?? name
      })
      counter.addCallback(async (observable) => {
        const observed = await calculate()

        for (const [key, value] of Object.entries(observed)) {
          if (values[key] == null) {
            values[key] = 0
          }

          values[key] += value

          observable.observe(values[key], {
            [label]: key
          })
        }
      })

      return
    }

    return new OpenTelemetryCounterGroup(label, meter.createCounter(name, {
      description: opts?.help ?? name
    }))
  }

  registerHistogram (name: string, opts: CalculatedHistogramOptions): void
  registerHistogram (name: string, opts?: HistogramOptions): Histogram
  registerHistogram (name: string, opts: CalculatedHistogramOptions | HistogramOptions = {}): any {
    if (name == null || name.trim() === '') {
      throw new InvalidParametersError('Metric name is required')
    }

    const meter = metrics.getMeterProvider().getMeter(this.meterName)

    if (isCalculatedMetricOptions<CalculatedHistogramOptions>(opts)) {
      return
    }

    return new OpenTelemetryHistogram(meter.createHistogram(name, {
      advice: {
        explicitBucketBoundaries: opts.buckets
      },
      description: opts?.help ?? name
    }))
  }

  registerHistogramGroup (name: string, opts: CalculatedHistogramOptions<Record<string, number>>): void
  registerHistogramGroup (name: string, opts?: HistogramOptions): HistogramGroup
  registerHistogramGroup (name: string, opts: CalculatedHistogramOptions | HistogramOptions = {}): any {
    if (name == null || name.trim() === '') {
      throw new InvalidParametersError('Metric name is required')
    }

    const meter = metrics.getMeterProvider().getMeter(this.meterName)
    const label = opts?.label ?? name

    if (isCalculatedMetricOptions<CalculatedHistogramOptions<Record<string, number>>>(opts)) {
      return
    }

    return new OpenTelemetryHistogramGroup(label, meter.createHistogram(name, {
      advice: {
        explicitBucketBoundaries: opts.buckets
      },
      description: opts?.help ?? name
    }))
  }

  registerSummary (name: string, opts: CalculatedSummaryOptions): void
  registerSummary (name: string, opts?: SummaryOptions): Summary
  registerSummary (name: string, opts: CalculatedSummaryOptions | SummaryOptions = {}): any {
    if (name == null || name.trim() === '') {
      throw new InvalidParametersError('Metric name is required')
    }

    const meter = metrics.getMeterProvider().getMeter(this.meterName)

    if (isCalculatedMetricOptions<CalculatedHistogramOptions>(opts)) {
      return
    }

    return new OpenTelemetrySummary(meter.createGauge(name, {
      description: opts?.help ?? name
    }))
  }

  registerSummaryGroup (name: string, opts: CalculatedSummaryOptions<Record<string, number>>): void
  registerSummaryGroup (name: string, opts?: SummaryOptions): SummaryGroup
  registerSummaryGroup (name: string, opts: CalculatedSummaryOptions | SummaryOptions = {}): any {
    if (name == null || name.trim() === '') {
      throw new InvalidParametersError('Metric name is required')
    }

    const meter = metrics.getMeterProvider().getMeter(this.meterName)
    const label = opts?.label ?? name

    if (isCalculatedMetricOptions<CalculatedSummaryOptions>(opts)) {
      return
    }

    return new OpenTelemetrySummaryGroup(label, meter.createGauge(name, {
      description: opts?.help ?? name
    }))
  }

  createTrace (): any {
    return context.active()
  }

  traceFunction <F extends (...args: any[]) => any> (name: string, fn: F, options?: TraceFunctionOptions<Parameters<F>, ReturnType<F>>): F {
    // @ts-expect-error returned function could be different to T
    return (...args: Parameters<F>): any => {
      const optionsIndex = options?.optionsIndex ?? 0
      // make sure we have an options object
      const opts = {
        ...(args[optionsIndex] ?? {})
      }
      args[optionsIndex] = opts

      // skip tracing if no context is passed
      if (opts.trace == null) {
        return fn.apply(null, args)
      }

      const attributes = {}

      // extract the parent context from the options object
      const parentContext = opts.trace
      const span = this.tracer.startSpan(name, {
        attributes: options?.getAttributesFromArgs?.(args, attributes)
      }, parentContext)

      const childContext = trace.setSpan(parentContext, span)
      opts.trace = childContext
      let result: any

      try {
        result = context.with(childContext, fn, undefined, ...args)
      } catch (err: any) {
        span.recordException(err)
        span.setStatus({ code: SpanStatusCode.ERROR, message: err.toString() })
        span.end()
        throw err
      }

      if (isPromise(result)) {
        return wrapPromise(result, span, attributes, options)
      }

      if (isGenerator(result)) {
        return wrapGenerator(result, span, attributes, options)
      }

      if (isAsyncGenerator(result)) {
        return wrapAsyncGenerator(result, span, attributes, options)
      }

      setAttributes(span, options?.getAttributesFromReturnValue?.(result, attributes))

      span.setStatus({ code: SpanStatusCode.OK })
      span.end()

      return result
    }
  }
}

export function openTelemetryMetrics (init: OpenTelemetryMetricsInit = {}): (components: OpenTelemetryComponents) => Metrics {
  return (components: OpenTelemetryComponents) => new OpenTelemetryMetrics(components, init)
}

export function isPromise <T = any> (obj?: any): obj is Promise<T> {
  return typeof obj?.then === 'function'
}

async function wrapPromise (promise: Promise<any>, span: Span, attributes: TraceAttributes, options?: TraceFunctionOptions<any, any>): Promise<any> {
  return promise
    .then(res => {
      setAttributes(span, options?.getAttributesFromReturnValue?.(res, attributes))
      span.setStatus({ code: SpanStatusCode.OK })
      return res
    })
    .catch(err => {
      span.recordException(err)
      span.setStatus({ code: SpanStatusCode.ERROR, message: err.toString() })
    })
    .finally(() => {
      span.end()
    })
}

export function isGenerator (obj: unknown): obj is Generator {
  if (obj == null) return false
  const iterator = (obj as { [Symbol.iterator]?: unknown })?.[Symbol.iterator]
  if (typeof iterator !== 'function') return false

  const instance = obj as { next?: unknown }
  return typeof instance.next === 'function'
}

function wrapGenerator (gen: Generator, span: Span, attributes: TraceAttributes, options?: TraceGeneratorFunctionOptions<any, any, any>): Generator {
  const iter = gen[Symbol.iterator]()
  let index = 0

  const wrapped: Generator = {
    next: () => {
      try {
        const res = iter.next()

        if (res.done === true) {
          setAttributes(span, options?.getAttributesFromReturnValue?.(res.value, attributes))
          span.setStatus({ code: SpanStatusCode.OK })
          span.end()
        } else {
          setAttributes(span, options?.getAttributesFromYieldedValue?.(res.value, attributes, ++index))
        }

        return res
      } catch (err: any) {
        span.recordException(err)
        span.setStatus({ code: SpanStatusCode.ERROR, message: err.toString() })
        span.end()

        throw err
      }
    },
    return: (value) => {
      return iter.return(value)
    },
    throw: (err) => {
      return iter.throw(err)
    },
    [Symbol.iterator]: () => {
      return wrapped
    }
  }

  return wrapped
}

export function isAsyncGenerator (obj: unknown): obj is AsyncGenerator {
  if (obj == null) return false
  const asyncIterator = (obj as { [Symbol.asyncIterator]?: unknown })?.[
    Symbol.asyncIterator
  ]
  if (typeof asyncIterator !== 'function') return false

  const instance = obj as { next?: unknown }
  return typeof instance.next === 'function'
}

function wrapAsyncGenerator (gen: AsyncGenerator, span: Span, attributes: TraceAttributes, options?: TraceGeneratorFunctionOptions<any, any, any>): AsyncGenerator {
  const iter = gen[Symbol.asyncIterator]()
  let index = 0

  const wrapped: AsyncGenerator = {
    next: async () => {
      try {
        const res = await iter.next()

        if (res.done === true) {
          setAttributes(span, options?.getAttributesFromReturnValue?.(res.value, attributes))
          span.setStatus({ code: SpanStatusCode.OK })
          span.end()
        } else {
          setAttributes(span, options?.getAttributesFromYieldedValue?.(res.value, attributes, ++index))
        }

        return res
      } catch (err: any) {
        span.recordException(err)
        span.setStatus({ code: SpanStatusCode.ERROR, message: err.toString() })
        span.end()

        throw err
      }
    },
    return: async (value) => {
      return iter.return(value)
    },
    throw: async (err) => {
      return iter.throw(err)
    },
    [Symbol.asyncIterator]: () => {
      return wrapped
    }
  }

  return wrapped
}

function isCalculatedMetricOptions <T> (opts?: any): opts is T {
  return opts?.calculate != null
}

function setAttributes (span: Span, attributes?: Attributes): void {
  if (attributes != null) {
    span.setAttributes(attributes)
  }
}
