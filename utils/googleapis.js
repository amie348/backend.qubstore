// setting up google auth and other google liberaries to interact with the google

// const {CLIENT_ID, GOOGLE_TOKEN_ERROR,  CREATING_GOOGLE_EVENT_ERROR, UPDATING_GOOGLE_EVENT_ERROR, GOOGLE_CALNDER_ID } = require('../config.js');

const { OAuth2Client , GoogleAuth} = require("google-auth-library");
// const client = new OAuth2Client(CLIENT_ID);
const { encode } = require('js-base64');

const { google , gmail_v1} = require('googleapis')
// const { OAuth2 } = google.auth

const path = require('path');
// const { SETTING_UP_EVENT } = require('./functions.js');
const scopes = ['https://mail.google.com/'];

// creating google auth using service account

const authenticate = (scopes) => {
  const auth = new GoogleAuth({
    keyFile: path.resolve(__dirname, 'key.json'),
    scopes,
  });

  return auth;
};
const authClient = authenticate(scopes)

const gmail = new gmail_v1.Gmail({auth: authClient})


const makeEmail = (to, from, subject, message) => {
    // OK, so here's the magic
    // The array is used only to make this easier to understand, everything is concatenated at the end
    // Set the headers first, then the recipient(s), sender & subject, and finally the message itself
    const str = [
        'Content-Type: text/plain; charset="UTF-8"\n', // Setting the content type as UTF-8 makes sure that the body is interpreted as such by Google
        'to: ', to,'\n',
        'from: ', from,'\n',
        // Here's the trick: by telling the interpreter that the string is base64 encoded UTF-8 string, you can send non-7bit-ASCII characters in the subject
        // I'm not sure why this is so not intuitive (probably historical/compatibility reasons),
        // but you need to make sure the encoding of the file, the server environment & everything else matches what you specify here
        'subject: =?utf-8?B?', encode(subject, true),'?=\n\n', // Encoding is base64 with URL safe settings - just in case you want a URL in the subject (pls no, doesn't make sense)
        message, // The message body can be whatever you want. Parse templates, write simple text, do HTML magic or whatever you like - just use the correct content type header
    ].join('');
    console.log(typeof str)

    const encodedMail = encode(str, true); // Base64 encode using URL safe settings
    console.log(typeof encodedMail)
    return encodedMail;
}



const sendMail = async()=>{
    try{
    const result = await gmail.users.messages.send({
        auth : authClient,
        requestBody:{
            to:"18321519-041@uog.edu.pk",
            from:"ahmadyaqoob1999@gmail.com",
            subject: "QubSTore",
            message: "Test Mail"// makeEmail(, , , )
        },
        userId: "me"

    })
    }catch(err){
        console.log("Error", err)
    }

}

module.exports = {
    sendMail
}
// creating google calnder 
// const calendar = google.calendar({ version: 'v3', auth: authenticate(scopes) })



// verifynig google token for google auth

