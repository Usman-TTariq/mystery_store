import { NextRequest, NextResponse } from 'next/server'
import { getEmailSettings } from '@/lib/services/emailService'
import { supabaseServer } from '@/lib/supabase/server'
import nodemailer from 'nodemailer'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email || !email.trim()) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      )
    }

    const emailSettings = await getEmailSettings()
    const recipientEmail = emailSettings?.email1 || emailSettings?.email2 || emailSettings?.email3 || 'yasalkhan90@gmail.com'

    console.log('📧 Email Settings:', {
      emailSettings: emailSettings
        ? { email1: emailSettings.email1, email2: emailSettings.email2, email3: emailSettings.email3 }
        : null,
      recipientEmail,
      subscriberEmail: email.trim(),
    })

    // Store subscription in Supabase
    const supabase = supabaseServer()
    const { error: dbError } = await supabase.from('newsletter_subscriptions').insert({
      email: email.trim(),
      recipient_email: recipientEmail,
      status: 'pending',
      created_at: new Date().toISOString(),
    })

    if (dbError) {
      console.error('Error saving newsletter subscription:', dbError)
    }

    // Send email using SMTP
    let emailSent = false
    let emailError: any = null

    const smtpHost = process.env.SMTP_HOST
    const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587
    const smtpUser = process.env.SMTP_USER
    const smtpPassword = process.env.SMTP_PASSWORD
    const smtpFrom = process.env.SMTP_FROM || smtpUser || 'COUPACHU <noreply@COUPACHU.com>'

    if (smtpHost && smtpUser && smtpPassword) {
      try {
        console.log('📤 Attempting to send email via SMTP:', {
          host: smtpHost,
          port: smtpPort,
          user: smtpUser,
          to: recipientEmail,
          from: smtpFrom,
        })

        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: smtpPort,
          secure: smtpPort === 465,
          auth: {
            user: smtpUser,
            pass: smtpPassword,
          },
          connectionTimeout: 10000,
          socketTimeout: 10000,
          greetingTimeout: 10000,
          requireTLS: smtpPort === 587,
          tls: {
            rejectUnauthorized: false,
            ciphers: 'SSLv3',
          },
        })

        console.log('🔌 Verifying SMTP connection...')
        await Promise.race([
          transporter.verify(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Connection verification timeout')), 10000)
          ),
        ])
        console.log('✅ SMTP connection verified')

        const mailOptions = {
          from: smtpFrom,
          to: recipientEmail,
          subject: 'New Newsletter Subscription Request',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #ea580c; margin-bottom: 20px;">New Newsletter Subscription</h2>
              <p style="color: #333; font-size: 16px; line-height: 1.6;">A new user has subscribed to your newsletter:</p>
              <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ea580c;">
                <p style="margin: 0; color: #333;"><strong>Subscriber Email:</strong> ${email.trim()}</p>
                <p style="margin: 10px 0 0 0; color: #333;"><strong>Date:</strong> ${new Date().toLocaleString()}</p>
              </div>
              <p style="color: #333; font-size: 16px; line-height: 1.6;">Please add this email to your newsletter list.</p>
            </div>
          `,
          text: `New Newsletter Subscription\n\nSubscriber Email: ${email.trim()}\nDate: ${new Date().toLocaleString()}\n\nPlease add this email to your newsletter list.`,
        }

        const info = await transporter.sendMail(mailOptions)

        emailSent = true
        console.log('✅ Email sent successfully via SMTP:', {
          recipientEmail,
          messageId: info.messageId,
        })
      } catch (err: any) {
        emailError = err
        console.error('❌ Error sending email via SMTP:', {
          error: err,
          message: err?.message,
          code: err?.code,
          recipientEmail,
          host: smtpHost,
          port: smtpPort,
        })
      }
    } else {
      console.warn('⚠️ SMTP configuration is incomplete. Email will not be sent.')
      console.warn('⚠️ Required: SMTP_HOST, SMTP_USER, SMTP_PASSWORD')
      emailError = {
        message: 'SMTP configuration is incomplete. Please check your environment variables.',
        code: 'SMTP_CONFIG_MISSING',
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Thank you for subscribing! Your email has been saved successfully.',
      emailSent,
      recipientEmail,
      emailError: emailError ? emailError.message : null,
    })
  } catch (error: any) {
    console.error('Error processing newsletter subscription:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to process subscription',
      },
      { status: 500 }
    )
  }
}
