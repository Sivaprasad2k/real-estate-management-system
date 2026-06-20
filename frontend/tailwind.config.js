export default {
    content: [
        "./index.html",
        "./src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                brand: {
                    DEFAULT: '#C9A227',
                    50: '#FDFBF5',
                    100: '#FAF6EB',
                    200: '#F1E8CC',
                    300: '#E7D8A9',
                    400: '#DDC782',
                    500: '#C9A227',
                    600: '#B5952B',
                    700: '#947A22',
                    800: '#756019',
                    900: '#5A4A13',
                },
                dark: {
                    DEFAULT: '#0F1115',
                    card: '#181B22',
                    border: '#222222',
                    muted: '#F5F5F5'
                },
                success: '#22C55E',
                warning: '#F59E0B',
                error: '#EF4444'
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                serif: ['Playfair Display', 'serif'],
            }
        },
    },
    plugins: [],
}
