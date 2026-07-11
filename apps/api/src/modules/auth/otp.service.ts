import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class OtpService {
  constructor(private configService: ConfigService) {}

  generateOTP(): string {
    if (this.configService.get('NODE_ENV') !== 'production') {
      return this.configService.get('OTP_DEV_CODE', '123456');
    }
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async sendOTP(phone: string, otp: string): Promise<void> {
    console.log(`📱 OTP for ${phone}: ${otp}`);

    // In production, integrate with MSG91, Twilio, or Firebase SMS
    // Example MSG91 integration:
    // await this.sendViaMSG91(phone, otp);
  }

  async sendViaMSG91(_phone: string, _otp: string): Promise<void> {
    // MSG91 API call implementation
    // const apiKey = this.configService.get('MSG91_API_KEY');
    // const senderId = this.configService.get('MSG91_SENDER_ID');
    // const templateId = this.configService.get('MSG91_TEMPLATE_ID');

    // MSG91 API call implementation
    // const response = await fetch(`https://api.msg91.com/api/v5/otp`, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'authkey': apiKey,
    //   },
    //   body: JSON.stringify({
    //     mobile: phone,
    //     otp: otp,
    //     sender: senderId,
    //     template_id: templateId,
    //   }),
    // });
  }
}
