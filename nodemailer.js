const nodemailer = require("nodemailer");
const googleApis = require("googleapis");
const REDIRECT_URI = `https://developers.google.com/oauthplayground`;
const CLIENT_ID = `570285492951-jalrujkaghisuat6gg6k47avlh5housr.apps.googleusercontent.com`;
const CLIENT_SECRET = `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`;
const REFRESH_TOKEN = `1//04zZ3GSs1zE-tCgYIARAAGAQSNwF-L9IrlPnAxR1mUIILoq8GmI_f9bqDoryRJGGiTE16fHR4iJULWt3YWNg4zcgqqkPAyS15oSg`;

const authClient = new googleApis.google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET,
REDIRECT_URI);

authClient.setCredentials({refresh_token: REFRESH_TOKEN});

async function mailer(reciever,id,key){
 try{
 const ACCESS_TOKEN = await authClient.getAccessToken();
 const transport = nodemailer.createTransport({
 service: "gmail",
 auth: {
 type: "OAuth2",
 user: "rathoremayank309@gmail.com",
 clientId: CLIENT_ID,
 clientSecret: CLIENT_SECRET,
 refreshToken: REFRESH_TOKEN,
 accessToken: ACCESS_TOKEN
 }
 })
 const details = {
 from: "rathoremayank309@gmail.com",
 to: reciever,
 subject: "kuchh bhi likh do",
 text: "message text",
 html: `hey you can recover your account by clicking following link <a href="http://localhost:3000/forgot/${id}/${key}">localhost:3000/forgot/${id}/${key}</a>`
 }
 const result = await transport.sendMail(details);
 return result;
 }
 catch(err){
 return err;
 }
}

module.exports = mailer