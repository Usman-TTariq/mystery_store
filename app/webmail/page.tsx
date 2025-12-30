import { redirect } from 'next/navigation';

export default function WebmailPage() {
  // Redirect to cPanel webmail
  // Using the base URL - cPanel will handle authentication and session
  redirect('https://cpanel1.hostingwinds.online:2096/3rdparty/roundcube/');
}

