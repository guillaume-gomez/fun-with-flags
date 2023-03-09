module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
    daisyui: {
      themes: [
        {
          mytheme: {
           "primary": "#009edb",
           "secondary": "#14532d",
           "accent": "#ff6b51",
           "neutral": "#1F272E",
           "base-100": "#333036",
           "info": "#7CA2F3",
           "success": "#40E7B5",
           "warning": "#DF8611",
           "error": "#EA1F26",

           "--rounded-box": "0.1rem",
          },
        },
      ],
  },
  plugins: [require("daisyui")],
}
