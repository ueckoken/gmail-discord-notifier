import { describe } from '@jest/globals'
import { type MailAttachment, msgDescription, chunkMsg } from '../src/mail'

class AttachmentStub implements MailAttachment {
  readonly nameMock: jest.Mock
  constructor (nameMock: jest.Mock) { this.nameMock = nameMock }
  getName (): string {
    return this.nameMock()
  }
}

describe('msgDescription', () => {
  const mock = jest.fn()
  test.each([
    { attachments: [], expected: 'メッセージが届きました！' },
    { attachments: [new AttachmentStub(mock)], expected: 'メッセージが届きました！\n添付ファイルがあります！メール本体の確認をお忘れなく' }
  ])('returns msg when attachments are $attachments', ({ attachments, expected }) => {
    const description = msgDescription({
      attachments,
      plainBody: 'body'
    })
    expect(description).toBe(expected)
  })
  test.each([
    { length: 1699, expected: 'メッセージが届きました！' },
    { length: 1700, expected: 'メッセージが届きました！\n文字数の上限を越えたので分割して投稿しています。' },
    { length: 1701, expected: 'メッセージが届きました！\n文字数の上限を越えたので分割して投稿しています。' }
  ])('returns msg when plainBody length is $length', ({ length, expected }) => {
    const description = msgDescription({
      attachments: [],
      plainBody: 'あ'.repeat(length)
    })
    expect(description).toBe(expected)
  })
  test('description order', () => {
    const description = msgDescription({
      attachments: [new AttachmentStub(mock)],
      plainBody: 'あ'.repeat(2000)
    })
    expect(description).toBe('メッセージが届きました！\n添付ファイルがあります！メール本体の確認をお忘れなく\n文字数の上限を越えたので分割して投稿しています。')
  })
  test('does not call attachments getName()', () => {
    expect(mock).not.toHaveBeenCalled()
  })
})
describe('mailHeader', () => {
  test.todo('this test will implement')
})

describe('chunkMsg', () => {
  test('does not chunk short message', () => {
    const actual = chunkMsg({ description: 'this is description', text: 'this is text.' }, 50)
    expect(actual).toHaveLength(1)
    expect(actual[0]).toBe('this is description\n```txt\nthis is text.\n```\n')
  })
  test('chunks long message', () => {
    const chunkLen = 30
    const text = 'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the' // the length of this text is 99.
    const actual = chunkMsg({ description: 'あ'.repeat(10), text }, chunkLen)
    expect(actual).toHaveLength(7)
    expect(actual[0]).toMatch(/ああああああああああ\n```txt\n.*\n```\n/)
    expect(actual[1]).toMatch(/```txt\n.*\n```\n/)
    expect(actual[2]).toMatch(/```txt\n.*\n```\n/)
    expect(actual[3]).toMatch(/```txt\n.*\n```\n/)
    expect(actual[4]).toMatch(/```txt\n.*\n```\n/)
    expect(actual[5]).toMatch(/```txt\n.*\n```\n/)
    expect(actual[6]).toMatch(/```txt\n.*\n```\n/)

    expect(actual[0]).toHaveLength(chunkLen)
    expect(actual[1]).toHaveLength(chunkLen)
    expect(actual[2]).toHaveLength(chunkLen)
    expect(actual[3]).toHaveLength(chunkLen)
    expect(actual[4]).toHaveLength(chunkLen)
    expect(actual[5]).toHaveLength(chunkLen)
    expect(actual[6]).toHaveLength(14)
  })
  test('chunks long message', () => {
    const chunkLen = 30
    const text = 'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been t' // the length of this text is 97.
    const actual = chunkMsg({ description: 'あ'.repeat(10), text }, chunkLen)
    expect(actual).toHaveLength(6)
    expect(actual[0]).toMatch(/ああああああああああ\n```txt\n.*\n```\n/)
    expect(actual[1]).toMatch(/```txt\n.*\n```\n/)
    expect(actual[2]).toMatch(/```txt\n.*\n```\n/)
    expect(actual[3]).toMatch(/```txt\n.*\n```\n/)
    expect(actual[4]).toMatch(/```txt\n.*\n```\n/)
    expect(actual[5]).toMatch(/```txt\n.*\n```\n/)

    expect(actual[0]).toHaveLength(chunkLen)
    expect(actual[1]).toHaveLength(chunkLen)
    expect(actual[2]).toHaveLength(chunkLen)
    expect(actual[3]).toHaveLength(chunkLen)
    expect(actual[4]).toHaveLength(chunkLen)
    expect(actual[5]).toHaveLength(chunkLen)
  })
})
