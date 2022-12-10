import 'google-apps-script'
// Discord 側へメッセージを送る
function postDiscord (message: string): GoogleAppsScript.URL_Fetch.HTTPResponse {
  // webhook置き場
  const webhookUrl = PropertiesService.getScriptProperties().getProperty('DISCORD_WEBHOOK_URL')

  // Discordへメッセージを送信する本体
  const payload = {
    username: PropertiesService.getScriptProperties().getProperty('WEBHOOK_USERNAME'),
    content: message
  } as const

  // Discordに送信する型を指定（おまじない）
  return UrlFetchApp.fetch(webhookUrl ?? '', {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload)
  })
}

class Mail {
  readonly msg: GoogleAppsScript.Gmail.GmailMessage
  constructor (msg: GoogleAppsScript.Gmail.GmailMessage) {
    this.msg = msg
  }

  formatedMsg (): string {
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

  msgHeader (): string {
    const headerElem: string[] = ['メッセージが届きました！']
    if (this.msg.getAttachments().length !== 0) { headerElem.push('添付ファイルがあります！メール本体の確認をお忘れなく') }
    if (this.msg.getPlainBody().length >= 1700) { headerElem.push('文字数が上限に達したので途中で切りました。続きはメール本体を確認してください') }
    return headerElem.join('\n')
  }
}

function fetchNewMails (searchCond: string): Mail[] {
  // 取得
  const myThreads = GmailApp.search(searchCond)
  return GmailApp.getMessagesForThreads(myThreads).map(msg => new Mail(msg.slice(-1)[0]))
}

// 検索する時間の開始地点を設定
function searchMailCurTime (): number {
  // 今回は61秒前を設定
  const now = Math.floor(new Date().getTime() / 1000)
  return now - (60 * 1 + 1)
}

// メールの検索条件を設定
// 詳しくはここ => https://support.google.com/mail/answer/7190?hl=ja
const mailSearchCond = (interval: number): string => `is:unread after: ${interval}`

// 実行してもらうのはこれ
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function main (): void {
  const newMails = fetchNewMails(mailSearchCond(searchMailCurTime()))
  for (const mail of newMails.filter(mail => !mail.msg.isDraft()).reverse()) {
    postDiscord(mail.formatedMsg())
  }
}
