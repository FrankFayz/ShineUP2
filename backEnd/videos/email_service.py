"""Email sending service for ShineUP."""
import secrets
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
from videos.models import EmailVerificationToken
from django.contrib.auth.models import User


class EmailService:
    """Handles all email operations for ShineUP."""

    @staticmethod
    def send_verification_email(user, email=None):
        """
        Send email verification link to user.
        
        Args:
            user: User instance
            email: Optional email address (for new users during registration)
        
        Returns:
            token: The verification token generated
        """
        target_email = email or user.email
        
        # Generate secure token
        token = secrets.token_urlsafe(32)
        expiry_time = timezone.now() + timedelta(
            hours=settings.EMAIL_VERIFICATION_LINK_EXPIRY_HOURS
        )
        
        # Create or update verification token
        EmailVerificationToken.objects.filter(user=user).delete()
        verification = EmailVerificationToken.objects.create(
            user=user,
            token=token,
            email=target_email,
            expires_at=expiry_time,
        )
        
        # Build verification link
        verification_link = f"{settings.FRONTEND_URL}/verify-email/{token}"
        
        # Email content
        subject = "Verify Your ShineUP Account"
        message = f"""
Hello {user.first_name or user.username},

Welcome to ShineUP! 🎉

To activate your account and start uploading videos, please verify your email by clicking the link below:

{verification_link}

This link will expire in {settings.EMAIL_VERIFICATION_LINK_EXPIRY_HOURS} hours.

If you didn't create this account, you can safely ignore this email.

Best regards,
The ShineUP Team
        """
        
        html_message = f"""
<html>
    <body style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h1 style="color: #333; text-align: center;">Welcome to ShineUP! 🎉</h1>
            <p style="color: #666; font-size: 16px;">Hi {user.first_name or user.username},</p>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
                Thank you for signing up! To activate your account and start uploading amazing videos, 
                please verify your email by clicking the button below:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{verification_link}" style="
                    background-color: #007bff; 
                    color: white; 
                    padding: 12px 30px; 
                    text-decoration: none; 
                    border-radius: 5px; 
                    font-size: 16px;
                    display: inline-block;
                ">Verify Email Address</a>
            </div>
            
            <p style="color: #999; font-size: 14px;">
                Or copy and paste this link in your browser:<br>
                <span style="word-break: break-all;">{verification_link}</span>
            </p>
            
            <p style="color: #999; font-size: 14px;">
                ⏰ This link expires in {settings.EMAIL_VERIFICATION_LINK_EXPIRY_HOURS} hours
            </p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <p style="color: #999; font-size: 12px;">
                If you didn't create this account, you can safely ignore this email.
            </p>
            
            <p style="color: #999; font-size: 12px; text-align: center;">
                © 2024 ShineUP. All rights reserved.
            </p>
        </div>
    </body>
</html>
        """
        
        # Send email
        try:
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[target_email],
                html_message=html_message,
                fail_silently=False,
            )
            return token
        except Exception as e:
            print(f"Error sending email: {str(e)}")
            raise

    @staticmethod
    def verify_email(token):
        """
        Verify email using token.
        
        Args:
            token: The verification token
            
        Returns:
            user: The verified user, or None if invalid/expired
        """
        try:
            verification = EmailVerificationToken.objects.get(token=token)
            
            if verification.is_expired():
                return None
            
            user = verification.user
            user.is_active = True
            user.email = verification.email  # Update email if changed
            user.save(update_fields=['is_active', 'email'])
            
            # Delete the verification token
            verification.delete()
            
            return user
        except EmailVerificationToken.DoesNotExist:
            return None

    @staticmethod
    def send_password_reset_email(user, reset_token):
        """
        Send password reset email to user.
        
        Args:
            user: User instance
            reset_token: The password reset token
        """
        reset_link = f"{settings.FRONTEND_URL}/reset-password/{reset_token}"
        
        subject = "Reset Your ShineUP Password"
        message = f"""
Hello {user.first_name or user.username},

We received a request to reset your password. Click the link below to set a new password:

{reset_link}

This link will expire in 1 hour.

If you didn't request this, you can safely ignore this email.

Best regards,
The ShineUP Team
        """
        
        html_message = f"""
<html>
    <body style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h1 style="color: #333; text-align: center;">Password Reset Request</h1>
            <p style="color: #666; font-size: 16px;">Hi {user.first_name or user.username},</p>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
                We received a request to reset your password. Click the button below to set a new password:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{reset_link}" style="
                    background-color: #007bff; 
                    color: white; 
                    padding: 12px 30px; 
                    text-decoration: none; 
                    border-radius: 5px; 
                    font-size: 16px;
                    display: inline-block;
                ">Reset Password</a>
            </div>
            
            <p style="color: #999; font-size: 14px;">
                ⏰ This link expires in 1 hour
            </p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <p style="color: #999; font-size: 12px;">
                If you didn't request this, you can safely ignore this email.
            </p>
        </div>
    </body>
</html>
        """
        
        try:
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                html_message=html_message,
                fail_silently=False,
            )
        except Exception as e:
            print(f"Error sending email: {str(e)}")
