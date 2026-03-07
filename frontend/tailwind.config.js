export default {
    content: [
        "./index.html",
        "./src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                brand: {
                    DEFAULT: '#D4AF37',
                    50: '#FDFBF5',
                    100: '#FAF6EB',
                    200: '#F1E8CC',
                    300: '#E7D8A9',
                    400: '#DDC782',
                    500: '#D4AF37',
                    600: '#B5952B',
                    700: '#947A22',
                    800: '#756019',
                    900: '#5A4A13',
                },
                dark: {
                    DEFAULT: '#0a0a0a',
                    card: '#1a1a1a',
                    border: '#2a2a2a'
                }
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                serif: ['Playfair Display', 'serif'],
            }
        },
    },
    plugins: [],
}
