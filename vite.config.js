module.exports = {
  devServer: {
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    },
  },

  // Production build optimizations
  configureWebpack: {
    devtool: 'source-map', // Safer than eval for production
  },

  // Security-focused CSP (Content Security Policy)
  // Note: For Vercel, these headers should be in vercel.json instead
  // This is for development only
  chainWebpack: (config) => {
    config.plugin('html').tap((args) => {
      args[0].meta = [
        ...(args[0].meta || []),
        {
          'http-equiv': 'Content-Security-Policy',
          content:
            "default-src 'self' https://*.supabase.co; script-src 'self' 'unsafe-inline' https://*.supabase.co; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co",
        },
      ]
      return args
    })
  },
}
