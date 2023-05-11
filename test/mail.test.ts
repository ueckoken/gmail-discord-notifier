import { type MailAttachment, msgDescription, chunkMsg } from '../src/mail'
import { mock, describe, it } from 'node:test'
import * as assert from 'node:assert/strict'

class AttachmentStub implements MailAttachment {
  readonly nameMock: ReturnType<typeof mock.fn>
  constructor (nameMock: ReturnType<typeof mock.fn>) { this.nameMock = nameMock }
  getName (): string {
    return this.nameMock()
  }
}

describe('msgDescription', () => {
  const mockFn = mock.fn()
  it('returns msg when attachments are $attachments', (t) => {
    for (const { attachments, expected } of [
      { attachments: [], expected: 'メッセージが届きました！' },
      { attachments: [new AttachmentStub(mockFn)], expected: 'メッセージが届きました！\n添付ファイルがあります！メール本体の確認をお忘れなく' }
    ]) {
      const description = msgDescription({
        attachments,
        plainBody: 'body'
      })
      assert.strictEqual(description, expected)
    }
  })
  it('returns msg when plainBody length is $length', () => {
    for (const { length, expected } of [
      { length: 1699, expected: 'メッセージが届きました！' },
      { length: 1700, expected: 'メッセージが届きました！\n文字数の上限を越えたので分割して投稿しています。' },
      { length: 1701, expected: 'メッセージが届きました！\n文字数の上限を越えたので分割して投稿しています。' }
    ]) {
      const description = msgDescription({
        attachments: [],
        plainBody: 'あ'.repeat(length)
      })
      assert.strictEqual(description, expected)
    }
  })
  it('description order', () => {
    const description = msgDescription({
      attachments: [new AttachmentStub(mockFn)],
      plainBody: 'あ'.repeat(2000)
    })
    assert.strictEqual(description, 'メッセージが届きました！\n添付ファイルがあります！メール本体の確認をお忘れなく\n文字数の上限を越えたので分割して投稿しています。')
  })
  it('does not call attachments getName()', () => {
    assert.strictEqual(mockFn.mock.calls.length, 0)
  })
})
describe('mailHeader', () => {
  it('this test will implement', { todo: true })
})

describe('chunkMsg', () => {
  it('does not chunk short message', () => {
    const actual = chunkMsg({ description: 'this is description', text: 'this is text.' }, 50)
    assert.strictEqual(actual.length, 1)
    assert.strictEqual(actual[0], 'this is description\n```txt\nthis is text.\n```\n')
  })
  it('chunks long message', () => {
    const chunkLen = 30
    const text = 'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the' // the length of this text is 99.
    const actual = chunkMsg({ description: 'あ'.repeat(10), text }, chunkLen)
    assert.strictEqual(actual.length, 7)
    assert.match(actual[0], /ああああああああああ\n```txt\n.*\n```\n/)
    assert.match(actual[1], /```txt\n.*\n```\n/)
    assert.match(actual[2], /```txt\n.*\n```\n/)
    assert.match(actual[3], /```txt\n.*\n```\n/)
    assert.match(actual[4], /```txt\n.*\n```\n/)
    assert.match(actual[5], /```txt\n.*\n```\n/)
    assert.match(actual[6], /```txt\n.*\n```\n/)

    assert.strictEqual(actual[0].length, chunkLen)
    assert.strictEqual(actual[1].length, chunkLen)
    assert.strictEqual(actual[2].length, chunkLen)
    assert.strictEqual(actual[3].length, chunkLen)
    assert.strictEqual(actual[4].length, chunkLen)
    assert.strictEqual(actual[5].length, chunkLen)
    assert.strictEqual(actual[6].length, 14)
  })
  it('chunks long message', () => {
    const chunkLen = 30
    const text = 'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been t' // the length of this text is 97.
    const actual = chunkMsg({ description: 'あ'.repeat(10), text }, chunkLen)
    assert.strictEqual(actual.length, 6)
    assert.match(actual[0], /ああああああああああ\n```txt\n.*\n```\n/)
    assert.match(actual[1], /```txt\n.*\n```\n/)
    assert.match(actual[2], /```txt\n.*\n```\n/)
    assert.match(actual[3], /```txt\n.*\n```\n/)
    assert.match(actual[4], /```txt\n.*\n```\n/)
    assert.match(actual[5], /```txt\n.*\n```\n/)

    assert.strictEqual(actual[0].length, chunkLen)
    assert.strictEqual(actual[1].length, chunkLen)
    assert.strictEqual(actual[2].length, chunkLen)
    assert.strictEqual(actual[3].length, chunkLen)
    assert.strictEqual(actual[4].length, chunkLen)
    assert.strictEqual(actual[5].length, chunkLen)
  })
})
