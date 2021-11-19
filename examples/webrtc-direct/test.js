'use strict'

const path = require('path')
const execa = require('execa')
const pDefer = require('p-defer')
const { toString: uint8ArrayToString } = require('uint8arrays/to-string')
const { chromium } = require('playwright');

function startNode (name, args = []) {
    return execa('node', [path.join(__dirname, name), ...args], {
        cwd: path.resolve(__dirname),
        all: true
    })
}

function startBrowser (name, args = []) {
    return execa('parcel', [path.join(__dirname, name), ...args], {
        preferLocal: true,
        localDir: __dirname,
        cwd: __dirname,
        all: true
    })
}

async function test () {
    // Step 1, listener process
    const listenerProcReady = pDefer()
    let listenerOutput = ''
    process.stdout.write('listener.js\n')
    const listenerProc = startNode('listener.js')

    listenerProc.all.on('data', async (data) => {
        process.stdout.write(data)
        listenerOutput += uint8ArrayToString(data)
        if (listenerOutput.includes('Listening on:') && listenerOutput.includes('12D3KooWCuo3MdXfMgaqpLC5Houi1TRoFqgK9aoxok4NK5udMu8m')) {
            listenerProcReady.resolve()
        }
    })

    await listenerProcReady.promise
    process.stdout.write('==================================================================\n')

    // Step 2, dialer process
    process.stdout.write('dialer.js\n')
    let dialerUrl = ''
    const dialerProc = startBrowser('index.html')

    dialerProc.all.on('data', async (chunk) => {
        /**@type {string} */
        const out = chunk.toString()

        if (out.includes('Server running at')) {
            dialerUrl = out.split('Server running at ')[1]
        }


        if (out.includes('Built in ')) {

            try {
                const browser = await chromium.launch();
                const page = await browser.newPage();
                await page.goto(dialerUrl);
                await page.waitForFunction(selector => document.querySelector(selector).innerText === 'libp2p started!', '#status')
                await page.waitForFunction(
                  selector => {
                      const text = document.querySelector(selector).innerText
                      return text.includes('libp2p id is') &&
                        text.includes('Found peer') &&
                        text.includes('Connected to')
                  },
                  '#output',
                  { timeout: 10000 }
                )
                await browser.close();
            } catch (/** @type {any} */ err) {
                console.error(err)
                process.exit(1)
            } finally {
                dialerProc.cancel()
                listenerProc.kill()
            }
        }
    })

    await Promise.all([
        listenerProc,
        dialerProc,
    ]).catch((err) => {
        if (err.signal !== 'SIGTERM') {
            throw err
        }
    })
}

module.exports = test
