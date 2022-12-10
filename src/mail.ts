import 'google-apps-script'
// Discord 側へメッセージを送る
function postDiscord (message: string): GoogleAppsScript.URL_Fetch.HTTPResponse {
  // webhook置き場
  const DISCORD_WEBHOOK = 'Here is Discord Token'

  // Discordへメッセージを送信する本体
  const payload = {
    username: 'Here is Discord webhook bot name',
    content: message
  } as const

  // Discordに送信する型を指定（おまじない）
  return UrlFetchApp.fetch(DISCORD_WEBHOOK, {
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
メッセージが届きました！ 
${this.msg.getAttachments().length !== 0 ? '添付ファイルがあります！メール本体の確認をお忘れなく' : ''}
${this.msg.getPlainBody().length > 1700 ? '文字数が多すぎます！メール本体にて確認してください。' : ''}
\`\`\`txt
[Date]
${this.msg.getDate().toString()}
[from]
${this.msg.getFrom()}
[to]
${this.msg.getTo()}
[cc]
${this.msg.getCc()}
[subject]
${this.msg.getSubject()}
[message]
${this.msg.getPlainBody().substring(0, 1700)}

\`\`\`

    `
  }
}
function fetchNewMail (interval: number): Mail[] {
  // 取得
  const myThreads = GmailApp.search(mailSearchCond(interval))
  return GmailApp.getMessagesForThreads(myThreads).map(msg => new Mail(msg.slice(-1)[0]))
}

// 検索する時間の開始地点を設定
// FIXME: いい感じの型制約を付ける
function searchMailCurTime (): number {
  // 今回は61秒前を設定
  const now = Math.floor(new Date().getTime() / 1000)
  return now - (60 * 1 + 1)
}

// メールの検索条件を設定
// 詳しくはここ => https://support.google.com/mail/answer/7190?hl=ja
function mailSearchCond (interval: number): string {
  return `is:unread after: ${interval}`
}

// 実行してもらうのはこれ
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function main (): void {
  const newMails = fetchNewMail(searchMailCurTime())
  for (const mail of newMails.reverse().filter(mail => !mail.msg.isDraft())) {
    postDiscord(mail.formatedMsg())
  }
}
