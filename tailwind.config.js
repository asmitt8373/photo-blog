/** @type {import('tailwindcss').Config} */
export default {
  content: ["./views/**/*.eta", "./views/*.eta"],
  theme: {
    extend: {},
  },
  plugins: [require("daisyui")],
};
