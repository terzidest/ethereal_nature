# Ethereal Nature

A nature-inspired ecommerce application built with React, React Native, and Firebase.

## 📱 Screenshots

![Web Screenshot](https://via.placeholder.com/800x400?text=Ethereal+Nature+Web)
![Mobile Screenshot](https://via.placeholder.com/400x800?text=Ethereal+Nature+Mobile)

## 🌿 About

Ethereal Nature is a full-stack ecommerce application that specializes in natural wellness products. Built with a modern React and React Native stack, it demonstrates best practices for cross-platform development.

## 🚀 Features

- **Cross-platform development** - Shared code between web and mobile
- **Responsive web application** - Built with React, Vite, and Tailwind CSS
- **Native mobile app** - Built with React Native, Expo, and NativeWind
- **Authentication** - User registration and login functionality
- **Product browsing** - View products by category, search, and filter
- **Shopping cart** - Add, remove, and update quantities
- **Checkout process** - Multi-step checkout with shipping and payment
- **User profiles** - View order history and manage account

## 🛠️ Technologies

### Web (React)
- React + Vite
- React Router DOM
- Tailwind CSS
- Zustand for state management

### Mobile (React Native)
- Expo
- React Navigation
- NativeWind
- Zustand for state management

### Shared
- TypeScript
- Firebase (Auth, Firestore, Storage)

## 📁 Project Structure

```
ethereal_nature/
├── packages/
│   ├── mobile/         # Expo/React Native app
│   ├── web/            # Vite + React web app
│   └── shared/         # Shared code (models, utilities, config)
├── firebase/           # Firebase configuration
├── package.json        # Root workspace configuration
└── README.md           # Project documentation
```

## 🚀 Getting Started

### Prerequisites

- Node.js 16+
- Yarn
- Firebase project

### Installation

1. Clone the repository
   ```
   git clone https://github.com/yourusername/ethereal-nature.git
   cd ethereal-nature
   ```

2. Install dependencies
   ```
   yarn install
   ```

3. Create a Firebase project and update the configuration in `firebase/index.ts`

### Running the applications

#### Web App
```
yarn dev:web
```

#### Mobile App (with Expo)
```
yarn dev:mobile
```

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check [issues page](https://github.com/yourusername/ethereal-nature/issues).

## 📝 License

This project is [MIT](LICENSE) licensed.

## 🙏 Acknowledgements

- Design inspiration from various nature-themed websites
- Images: Placeholder images used for demonstration
