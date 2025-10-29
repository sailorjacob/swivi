import React from 'react'

interface LogoProps {
  className?: string
  size?: number
}

export const TikTokLogo: React.FC<LogoProps> = ({ className = '', size = 20 }) => (
  <svg
    viewBox="0 0 48 48"
    width={size}
    height={size}
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M34.3 9.5c-1.7-2.9-1.7-6.4 0-9.4h-8.5c0 8.5-6.9 15.4-15.4 15.4v8.5c2.8 0 5.4-.7 7.7-2.1v13.6c0 6.9-5.6 12.5-12.5 12.5S0 42.4 0 35.5s5.6-12.5 12.5-12.5c.7 0 1.4.1 2.1.2v-8.7c-8.5.3-15.3 7.3-15.3 15.9 0 8.8 7.1 15.9 15.9 15.9s15.9-7.1 15.9-15.9V19.1c3.4 2.4 7.5 3.8 11.9 3.8v-8.5c-3.7 0-7-1.5-9.6-3.9z"
      fill="currentColor"
    />
  </svg>
)

export const YouTubeLogo: React.FC<LogoProps> = ({ className = '', size = 20 }) => (
  <svg
    viewBox="0 0 48 48"
    width={size}
    height={size}
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fill="#FF0000"
      d="M43.2 12.4c-.5-1.9-1.9-3.4-3.8-3.9C36.1 7.8 24 7.8 24 7.8s-12.1 0-15.4.7c-1.9.5-3.3 2-3.8 3.9C4 15.7 4 24 4 24s0 8.3.8 11.6c.5 1.9 1.9 3.4 3.8 3.9 3.3.7 15.4.7 15.4.7s12.1 0 15.4-.7c1.9-.5 3.3-2 3.8-3.9.8-3.3.8-11.6.8-11.6s0-8.3-.8-11.6z"
    />
    <path fill="#FFF" d="M19 31V17l13 7z" />
  </svg>
)

export const InstagramLogo: React.FC<LogoProps> = ({ className = '', size = 20 }) => (
  <svg
    viewBox="0 0 48 48"
    width={size}
    height={size}
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <radialGradient id="instagramGradient" cx="19.38" cy="42.03" r="44.9">
      <stop offset="0" stopColor="#fd5" />
      <stop offset=".33" stopColor="#ff543f" />
      <stop offset=".67" stopColor="#c837ab" />
    </radialGradient>
    <path
      fill="url(#instagramGradient)"
      d="M34.02 0H13.98C6.25 0 0 6.25 0 13.98v20.04C0 41.75 6.25 48 13.98 48h20.04C41.75 48 48 41.75 48 34.02V13.98C48 6.25 41.75 0 34.02 0zM24 36.6c-6.95 0-12.6-5.65-12.6-12.6S17.05 11.4 24 11.4s12.6 5.65 12.6 12.6-5.65 12.6-12.6 12.6zm13.2-22.8c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z"
    />
    <circle cx="24" cy="24" r="8" fill="#fff" />
  </svg>
)

export const TwitterLogo: React.FC<LogoProps> = ({ className = '', size = 20 }) => (
  <svg
    viewBox="0 0 48 48"
    width={size}
    height={size}
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fill="#000000"
      d="M36.6 6h6.2l-13.5 15.4L45 42h-12.5l-9.8-12.8L11.4 42H5.2l14.4-16.5L4 6h12.8l8.8 11.6L36.6 6zM34.4 38.4h3.4L13.8 9.4h-3.7L34.4 38.4z"
    />
  </svg>
)

// Export a function to get the right logo component
export const getPlatformLogo = (platform: string, className?: string, size?: number) => {
  switch (platform.toUpperCase()) {
    case 'TIKTOK':
      return <TikTokLogo className={className} size={size} />
    case 'YOUTUBE':
      return <YouTubeLogo className={className} size={size} />
    case 'INSTAGRAM':
      return <InstagramLogo className={className} size={size} />
    case 'TWITTER':
    case 'X':
      return <TwitterLogo className={className} size={size} />
    default:
      return null
  }
}

