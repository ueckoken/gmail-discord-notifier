import { describe } from '@jest/globals'
import { type mailAttachment, msgDescription } from '../src/mail'

class AttachmentStub implements mailAttachment {
  readonly nameMock: jest.Mock
  constructor(nameMock: jest.Mock) { this.nameMock = nameMock }
  getName(): string {
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
    { length: 1700, expected: 'メッセージが届きました！\n文字数が上限に近づいたので途中で切れている可能性があります。メール本体を確認してください' },
    { length: 1701, expected: 'メッセージが届きました！\n文字数が上限に近づいたので途中で切れている可能性があります。メール本体を確認してください' }
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
    expect(description).toBe('メッセージが届きました！\n添付ファイルがあります！メール本体の確認をお忘れなく\n文字数が上限に近づいたので途中で切れている可能性があります。メール本体を確認してください')
  })
  test('does not call attachments getName()', () => {
    expect(mock).toHaveBeenCalledTimes(0)
  })
})
describe('mailHeader', () => {
  test.todo('this test will implement')
})

describe("chunkMsg", () => {
  test.each([
    { msg: { description: "aaa", text: "あ".repeat(200) }, length: 2 }
  ])("returns $length msgs", ({ msg, length }) => {
    const actual = chunkMsg({ text: msg.text, description: msg.description }, 50)
    expect(actual).toHaveLength(length)
    expect(actual[0]).toHaveLength(50)
  })
})
// describe('createMsgs', () => {
//   const msg: mailPayload = {
//     attachments: [],
//     bcc: "",
//     cc: "",
//     date: new Date(),
//     from: "Bob",
//     plainBody: "",
//     subject: "Mail subject",
//     to: "Alice"
//   }
//   test("chunk msgs by limit", () => {
//     let newMsg = msg
//     newMsg.plainBody = "あ".repeat(200)
//     const actual = createMsg(newMsg, 50)
//     expect(actual).toHaveLength(4)
//     expect(actual[0]).toHaveLength(50)
//     expect(actual[1]).toBe("")

//   })


// }
// )
