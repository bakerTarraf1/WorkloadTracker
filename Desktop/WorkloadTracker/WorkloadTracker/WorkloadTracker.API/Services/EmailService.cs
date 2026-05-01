using System.Net;
using System.Net.Mail;

namespace WorkloadTracker.API.Services
{
    public class EmailService
    {
        private readonly IConfiguration _configuration;

        public EmailService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public async Task SendResetCodeAsync(string toEmail, string code, string userName)
        {
            var from = _configuration["Email:From"];
            var password = _configuration["Email:Password"];
            var host = _configuration["Email:SmtpHost"];
            var port = int.Parse(_configuration["Email:SmtpPort"]!);

            var subject = "WorkloadTracker — Password Reset Code";

            var body = $@"
<!DOCTYPE html>
<html>
<head>
  <meta charset='UTF-8'>
  <style>
    body {{ font-family: 'Segoe UI', Arial, sans-serif; background: #f4f4f8; margin: 0; padding: 20px; }}
    .container {{ max-width: 480px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(99,102,241,0.12); }}
    .header {{ background: linear-gradient(135deg, #6366f1, #a855f7); padding: 32px 24px; text-align: center; }}
    .header h1 {{ color: white; margin: 0; font-size: 24px; font-weight: 800; }}
    .header p {{ color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 14px; }}
    .body {{ padding: 32px 24px; }}
    .greeting {{ color: #1a1a2e; font-size: 16px; margin-bottom: 16px; }}
    .message {{ color: #4a4a6a; font-size: 14px; line-height: 1.6; margin-bottom: 24px; }}
    .code-box {{ background: #f4f4f8; border: 2px dashed #6366f1; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; }}
    .code {{ font-size: 40px; font-weight: 900; letter-spacing: 12px; color: #6366f1; font-family: monospace; }}
    .expire {{ color: #8888aa; font-size: 12px; margin-top: 8px; }}
    .warning {{ background: #fff8e7; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 8px; margin: 16px 0; }}
    .warning p {{ color: #92400e; font-size: 13px; margin: 0; }}
    .footer {{ background: #f4f4f8; padding: 20px 24px; text-align: center; }}
    .footer p {{ color: #8888aa; font-size: 12px; margin: 0; }}
  </style>
</head>
<body>
  <div class='container'>
    <div class='header'>
      <h1>WorkloadTracker</h1>
      <p>Password Reset Request</p>
    </div>
    <div class='body'>
      <p class='greeting'>Hello, <strong>{userName}</strong> 👋</p>
      <p class='message'>
        We received a request to reset your password. 
        Use the code below to complete your password reset.
      </p>
      <div class='code-box'>
        <div class='code'>{code}</div>
        <p class='expire'>⏰ This code expires in <strong>10 minutes</strong></p>
      </div>
      <div class='warning'>
        <p>⚠️ If you didn't request this, please ignore this email. Your account is safe.</p>
      </div>
      <p class='message'>
        Enter this code on the WorkloadTracker login page to reset your password.
      </p>
    </div>
    <div class='footer'>
      <p>WorkloadTracker Team • This is an automated message</p>
    </div>
  </div>
</body>
</html>";

            using var client = new SmtpClient(host, port)
            {
                EnableSsl = true,
                Credentials = new NetworkCredential(from, password)
            };

            var mail = new MailMessage
            {
                From = new MailAddress(from!, "WorkloadTracker"),
                Subject = subject,
                Body = body,
                IsBodyHtml = true
            };

            mail.To.Add(toEmail);
            await client.SendMailAsync(mail);
        }
    }
}