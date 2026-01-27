# WebVizion - Real User Monitoring System

A comprehensive Real User Monitoring (RUM) system inspired by Grafana Faro, built to capture, analyze, and visualize real-time user experience metrics from web applications. Monitor everything from page load times to user interactions and errors - all in one unified dashboard.

## 🌐 Live Demos

- **Dashboard:** [https://webvizion.netlify.app/](https://webvizion.netlify.app/)
- **Demo Application:** [https://webvizion-demo.netlify.app/](https://webvizion-demo.netlify.app/)

> **Note:** The backend server may be a bit slow as it is hosted on a free tier. Initial requests might take a few seconds to wake up the server. Please be patient!

## ✨ Features

- 🎯 **Real User Monitoring** - Track actual user experiences in production
- 📊 **Web Vitals Tracking** - Monitor Core Web Vitals (LCP, FCP, CLS, FID, TTFB)
- ⚡ **Page Speed Analytics** - Measure load times, DOM ready, and resource timing
- 🐛 **Error Tracking** - Capture JavaScript errors and unhandled promise rejections
- 👤 **Session Management** - Track user sessions with unique identifiers
- 📈 **Real-time Dashboard** - Beautiful Grafana Faro-inspired UI with live updates
- 🌓 **Dark/Light Mode** - Toggle between themes for comfortable viewing
- 📱 **Responsive Design** - Works seamlessly on desktop, tablet, and mobile
- 🔴 **Live Mode** - Auto-refresh data with configurable intervals
- 🎨 **Multiple Views** - Dashboard, Web Vitals, Errors, Page Speed, Sessions, Analytics

## 🎯 Use Case

WebVizion helps you **manage all your web application metrics** in one centralized location:

- **Performance Monitoring:** Track page load times, resource loading, and Core Web Vitals to ensure optimal user experience
- **Error Detection:** Catch and analyze JavaScript errors before they impact your users
- **User Behavior Analytics:** Understand how users interact with your application through session tracking and user actions
- **Business Intelligence:** Make data-driven decisions with comprehensive analytics and historical trends
- **Proactive Optimization:** Identify performance bottlenecks and slow pages to prioritize improvements
- **Real-time Alerts:** Monitor critical metrics in real-time and respond quickly to issues

## 🏗️ System Architecture

```
┌─────────────────┐
│   Demo App      │  React + Vite (Port 3001)
│   rum-demo-app  │  
│  ┌───────────┐  │
│  │ RUM SDK   │──┼──┐
│  └───────────┘  │  │  HTTP POST /api/rum
└─────────────────┘  │
                     ▼
┌─────────────────┐
│   Backend       │  Spring Boot + H2 (Port 8080)
│   Rum/          │  Event Processing & Storage
└─────────────────┘
         │
         │  HTTP GET /api/rum/*
         ▼
┌─────────────────┐
│   Dashboard     │  React + Vite (Port 3000)
│   rum-ui        │  Data Visualization
└─────────────────┘
```

## 📦 Components

### 1. RUM SDK (`rum-sdk/`)
TypeScript SDK for capturing and sending RUM events to the backend.

### 2. Backend (`Rum/`)
Spring Boot application that processes and stores monitoring data.

### 3. Dashboard (`rum-ui/`)
React-based dashboard for visualizing metrics in real-time.

### 4. Demo App (`rum-demo-app/`)
Sample React application demonstrating SDK integration.

## 🚀 Quick Start

### Prerequisites

- **Node.js** 16+ and npm
- **Java** 17+ and Maven (for backend)
- **Git**

### Installation

#### 1. Clone the Repository

```bash
git clone https://github.com/jeet1703/rumtest.git
cd rumtest
```

#### 2. Setup Backend (Spring Boot)

```bash
cd Rum
mvn clean install
mvn spring-boot:run
```

Backend will start on `http://localhost:8080`

#### 3. Setup RUM SDK

```bash
cd rum-sdk
npm install
npm run build
```

#### 4. Setup Dashboard

```bash
cd rum-ui
npm install
npm run dev
```

Dashboard will start on `http://localhost:3000`

#### 5. Setup Demo Application

```bash
cd rum-demo-app
npm install
npm run dev
```

Demo app will start on `http://localhost:3001`

### 🎯 Try It Out

1. Open the **Demo App** at `http://localhost:3001`
2. Interact with the demo (click buttons, navigate, generate errors)
3. Open the **Dashboard** at `http://localhost:3000`
4. Watch metrics appear in real-time! 🎉

## 📚 Package Installation Guide

### Installing RUM SDK as NPM Package

The RUM SDK can be installed in your own application:

```bash
npm install @rum/rum-sdk-core
```

Or if using the local package:

```bash
cd rum-sdk
npm install
npm run build
```

Then in your project:

```bash
npm install ../path/to/rum-sdk
```

### Using RUM SDK in Your Application

```javascript
import RUMWrapper from '@rum/rum-sdk-core';

// Initialize the SDK
const rum = new RUMWrapper({
  apiUrl: 'http://localhost:8080/api/rum',
  appName: 'my-app',
  appVersion: '1.0.0',
  environment: 'production',
  batchSize: 10,
  batchInterval: 5000,
  enableAutoTracking: true,
  enableWebVitals: true,
  enableErrorTracking: true
});

// SDK automatically tracks:
// - Page views
// - Web vitals (LCP, FCP, CLS, FID, TTFB)
// - JavaScript errors
// - Page speed metrics

// Track custom events
rum.trackUserAction('button_click', { button: 'signup' });
rum.trackError(new Error('Something went wrong'), 'manual');
```

### Dashboard Installation

```bash
cd rum-ui
npm install
npm run dev      # Development mode
npm run build    # Production build
npm run preview  # Preview production build
```

### Demo App Installation

```bash
cd rum-demo-app
npm install
npm run dev      # Development mode
npm run build    # Production build
```

## 📖 Documentation

- **[Complete System Overview](COMPLETE_SYSTEM_OVERVIEW.md)** - Architecture and data flow
- **[Setup Guide](SETUP_GUIDE.md)** - Detailed setup instructions
- **[Deployment Guide - Standalone](DEPLOYMENT_GUIDE_STANDALONE.md)** - Production deployment
- **[Deployment Guide - Nexus](DEPLOYMENT_GUIDE_NEXUS.md)** - NPM registry deployment
- **[Dashboard README](rum-ui/README.md)** - Dashboard documentation
- **[Demo App README](rum-demo-app/README.md)** - Demo app usage guide

## 🛠️ Tech Stack

### Backend
- **Spring Boot** - REST API framework
- **H2 Database** - In-memory data storage
- **JPA/Hibernate** - ORM
- **Maven** - Build tool

### Frontend (Dashboard & Demo App)
- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **Recharts** - Data visualization
- **Axios** - HTTP client

### SDK
- **TypeScript** - Type-safe SDK
- **Performance API** - Web vitals measurement
- **Navigator API** - Device information

## 🔧 Configuration

### Backend Configuration

Edit `Rum/src/main/resources/application.properties`:

```properties
server.port=8080
spring.h2.console.enabled=true
spring.datasource.url=jdbc:h2:mem:rumdb
```

### Dashboard Configuration

Update API endpoint in `rum-ui/src/services/apiService.js`:

```javascript
const API_BASE_URL = 'http://localhost:8080/api/rum';
```

### Demo App Configuration

Update SDK initialization in `rum-demo-app/src/App.jsx`:

```javascript
apiUrl: 'http://localhost:8080/api/rum'
```

## 📊 Available Metrics

### Core Web Vitals
- **LCP** (Largest Contentful Paint) - Loading performance
- **FCP** (First Contentful Paint) - Initial rendering
- **CLS** (Cumulative Layout Shift) - Visual stability
- **FID** (First Input Delay) - Interactivity
- **TTFB** (Time to First Byte) - Server response time

### Page Speed
- Total load time
- DOM Content Loaded
- DOM Interactive
- Resource load time

### Errors
- JavaScript errors with stack traces
- Unhandled promise rejections
- Error frequency and trends

### User Actions
- Page views
- Custom events
- User interactions
- Session tracking

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License.

## 👤 Author

**Prabhjeet Singh** ([@jeet1703](https://github.com/jeet1703))

## 🙏 Acknowledgments

- Inspired by [Grafana Faro](https://grafana.com/oss/faro/)
- Built with modern web technologies
- Community feedback and contributions

## 📞 Support

For questions, issues, or feedback:
- Open an issue on [GitHub](https://github.com/jeet1703/rumtest/issues)
- Check existing [documentation](COMPLETE_SYSTEM_OVERVIEW.md)

---

**Happy Monitoring! 🚀**

Built with ❤️ for better web performance
