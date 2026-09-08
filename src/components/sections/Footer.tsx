const SOCIALS = [
  { href: 'https://x.com/raimonvibe/', icon: 'fa-x-twitter', label: 'X', accent: 'from-stone-700 to-stone-900' },
  {
    href: 'https://www.youtube.com/channel/UCDGDNuYb2b2Ets9CYCNVbuA/videos/',
    icon: 'fa-youtube',
    label: 'YouTube',
    accent: 'from-red-500 to-red-600',
  },
  { href: 'https://www.tiktok.com/@raimonvibe/', icon: 'fa-tiktok', label: 'TikTok', accent: 'from-stone-800 to-black' },
  {
    href: 'https://www.instagram.com/raimonvibe/',
    icon: 'fa-instagram',
    label: 'Instagram',
    accent: 'from-pink-500 to-orange-500',
  },
  { href: 'https://medium.com/@raimonvibe/', icon: 'fa-medium', label: 'Medium', accent: 'from-stone-600 to-stone-700' },
  { href: 'https://github.com/raimonvibe/', icon: 'fa-github', label: 'GitHub', accent: 'from-stone-600 to-stone-800' },
  {
    href: 'https://www.linkedin.com/in/raimonvibe/',
    icon: 'fa-linkedin-in',
    label: 'LinkedIn',
    accent: 'from-blue-600 to-blue-700',
  },
  {
    href: 'https://www.facebook.com/profile.php?id=61563450007849',
    icon: 'fa-facebook-f',
    label: 'Facebook',
    accent: 'from-blue-500 to-blue-600',
  },
]

export function Footer() {
  return (
    <footer className="mt-16 border-t border-stone-200 bg-stone-900 dark:border-stone-800">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:py-12">
        <div className="text-center">
          <h3 className="mb-6 text-lg font-semibold text-white sm:text-xl">Connect with Raimon</h3>
          <ul className="flex flex-wrap justify-center gap-3 sm:gap-4">
            {SOCIALS.map((social) => (
              <li key={social.label}>
                <a
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-to-r ${social.accent} text-white transition-transform duration-200 hover:scale-110 sm:h-12 sm:w-12`}
                >
                  <i className={`fab ${social.icon} text-base sm:text-lg`} aria-hidden="true" />
                  <span className="sr-only">{social.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-10 border-t border-stone-800 pt-6 text-center">
          <p className="text-sm text-stone-400">
            Built to make the Claude API approachable. Not affiliated with Anthropic — check the{' '}
            <a
              href="https://platform.claude.com/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-400 underline underline-offset-2 hover:text-orange-300"
            >
              official documentation
            </a>{' '}
            for the last word on pricing and models.
          </p>
          <p className="mt-2 text-xs text-stone-500">
            Your API key is stored in your own browser and sent only to Anthropic.
          </p>
        </div>
      </div>
    </footer>
  )
}
