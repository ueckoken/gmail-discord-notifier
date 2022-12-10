import 'google-apps-script'

class Mail {
  readonly msg: GoogleAppsScript.Gmail.GmailMessage
  constructor (msg: GoogleAppsScript.Gmail.GmailMessage) {
    this.msg = msg
  }

  formattedMsg (): string {
    return `
${this.msgHeader()}
\`\`\`txt
[Date] ${this.msg.getDate().toString()}
[from] ${this.msg.getFrom()}
[to] ${this.msg.getTo()}
[cc] ${this.msg.getCc()}
[subject] ${this.msg.getSubject()}
[message]
${this.msg.getPlainBody().substring(0, 1700)}

\`\`\`

    `
  }

  private msgHeader (): string {
    const headerElems: string[] = ['メッセージが届きました！']
    if (this.msg.getAttachments().length !== 0) { headerElems.push('添付ファイルがあります！メール本体の確認をお忘れなく') }
    if (this.msg.getPlainBody().length >= 1700) { headerElems.push('文字数が上限に達したので途中で切りました。続きはメール本体を確認してください') }
    return headerElems.join('\n')
  }
}

// Discord 側へメッセージを送る
function postDiscord (message: string): GoogleAppsScript.URL_Fetch.HTTPResponse {
  const webhookUrl = PropertiesService.getScriptProperties().getProperty('DISCORD_WEBHOOK_URL')
  const payload = {
    username: PropertiesService.getScriptProperties().getProperty('WEBHOOK_USERNAME'),
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
  return GmailApp.getMessagesForThreads(myThreads).map(msg => new Mail(msg.slice(-1)[0]))
}

const dateSubsec = (date: Date, subSec: number): Date => new Date(date.getTime() - subSec * 1000)

// メールの検索条件を設定
// 詳しくはここ => https://support.google.com/mail/answer/7190?hl=ja
const mailSearchCond = (curFrom: number): string => `is:unread after: ${curFrom}`

// 実行してもらうのはこれ
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function main (): void {
  // 1分おきにトリガーされるので61秒前から検索する
  const newMails = fetchNewMails(mailSearchCond(dateSubsec(new Date(), 61).getTime()))
  for (const mail of newMails.filter(mail => !mail.msg.isDraft()).reverse()) {
    postDiscord(mail.formattedMsg())
  }
}
