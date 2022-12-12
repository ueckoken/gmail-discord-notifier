import 'google-apps-script'
const discordMsgMaxLen = 2000
class Mail {
  readonly msg: GoogleAppsScript.Gmail.GmailMessage
  constructor (msg: GoogleAppsScript.Gmail.GmailMessage) {
    this.msg = msg
  }

  formattedMsg (maxLen: number): string {
    const header = this.msgHeader()
    // code要素の中の長さをmaxLenギリギリまで詰めるようにする
    // 余裕を持たせて30を追加している。本当はテストで境界を保証したい
    const payloadLen = maxLen - header.length - '\n```txt\n\n```\n'.length - 30 
    return `${header}
\`\`\`txt
${this.payload().substring(payloadLen)}
\`\`\`
`
  }

  private msgHeader (): string {
    const headerElems: string[] = ['メッセージが届きました！']
    if (this.msg.getAttachments().length !== 0) {
      headerElems.push('添付ファイルがあります！メール本体の確認をお忘れなく')
    }
    if (this.msg.getPlainBody().length >= 1700) {
      headerElems.push(
        '文字数が上限に近づいたので途中で切れている可能性があります。メール本体を確認してください'
      )
    }
    return headerElems.join('\n')
  }

  private payload (): string {
    return `[Date] ${this.msg.getDate().toString()}
[From] ${this.msg.getFrom()}
[To] ${this.msg.getTo()}
[Cc] ${this.msg.getCc()}
[Subject] ${this.msg.getSubject()}
[attachment] ${this.msg.getAttachments().map(a => a.getName()).join(' ')}

${this.msg.getPlainBody()}
`
  }
}

// Discord 側へメッセージを送る
function postDiscord (message: string): GoogleAppsScript.URL_Fetch.HTTPResponse {
  const webhookUrl = PropertiesService.getScriptProperties().getProperty(
    'DISCORD_WEBHOOK_URL'
  )
  const payload = {
    username:
      PropertiesService.getScriptProperties().getProperty('WEBHOOK_USERNAME'),
    content: message
  } as const

  return UrlFetchApp.fetch(webhookUrl ?? '', {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload)
  })
}

function fetchNewMails (searchCond: string): Mail[] {
  const myThreads = GmailApp.search(searchCond)
  return GmailApp.getMessagesForThreads(myThreads).map(
    msg => new Mail(msg.slice(-1)[0])
  )
}

const dateSubsec = (date: Date, subSec: number): Date =>
  new Date(date.getTime() - subSec * 1000)

// メールの検索条件を設定
// 詳しくはここ => https://support.google.com/mail/answer/7190?hl=ja
const mailSearchCond = (curFromUnixSec: number): string =>
  `is:unread after: ${curFromUnixSec}`

// 実行してもらうのはこれ
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function main (): void {
  // 1分おきにトリガーされるので61秒前から検索する
  const newMails = fetchNewMails(
    mailSearchCond(Math.floor(dateSubsec(new Date(), 61).getTime() / 1000))
  )
  for (const mail of newMails.filter(mail => !mail.msg.isDraft()).reverse()) {
    postDiscord(mail.formattedMsg(discordMsgMaxLen))
  }
}
