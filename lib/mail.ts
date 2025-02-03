import nodemailer from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';


// const transport = nodemailer.createTransport({
//     host: process.env.MAIL_HOST,
//     port: process.env.MAIL_PORT,
//     secure: process.env.NODE_ENV !== 'development', // true
//     auth: {
//         user: process.env.MAIL_USER,
//         pass: process.env.MAIL_PASSWORD
//     },
// } as SMTPTransport.Options)

// type SendEmailDTo = {
//     sender: Mail.Address,
//     receipients: Mail.Address[],
//     subject: string;
//     message: string;

// }


export async function sendMail ({to, name, subject, body} : { 
        to: string; 
        name: string; 
        subject: string; 
        body: string}) {
    
        const { SMTP_EMAIL, SMTP_PASSWORD } = process.env;
        
       const transport = nodemailer.createTransport({
           service: "gmail",
           auth: {
                    user: SMTP_EMAIL,
                    pass: SMTP_PASSWORD
                },
       });

    try {
        const testResult = await transport.verify();
        console.log(testResult);
    } catch (error) {
        console.log(error);
        return;
    }

    try {
        const sendResult = await transport.sendMail({
            from: SMTP_EMAIL,
            to,
            subject ,
            html: body , 
        })

          console.log(sendResult);
        
        } catch (error) {
            console.log(error);
        }


    // return await transport.sendMail({
    //     from: sender,
    //     to: receipients,
    //     subject,
    //     html: message,
    //     text: message,
    // })
    
}