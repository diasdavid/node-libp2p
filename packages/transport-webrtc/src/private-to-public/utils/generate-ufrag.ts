const charset = Array.from('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890')

export const genUfrag = (len: number): string => [...Array(len)].map(() => charset.at(Math.floor(Math.random() * charset.length))).join('')
