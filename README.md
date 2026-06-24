# Suraj Ventures - Feature-Based Product Discovery Platform

A modern, responsive web application that helps users discover products based on **ingredients, benefits, and features** instead of brand names.

## 🚀 Features

- **Ingredient-Based Search**: Find products by specific ingredients
- **Multi-Facet Filtering**: Filter by ingredients, features, and benefits
- **Product Discovery**: Browse through 4 main categories
- **User Authentication**: Email/password registration and login via Firebase
- **User Dashboard**: Track saved products and inquiries
- **Product Bookmarks**: Save favorite products for later
- **Inquiry System**: Request information about products
- **Admin Panel**: Manage products, users, and inquiries
- **Responsive Design**: Mobile-first, works on all devices
- **Modern UI**: Clean, premium design with Tailwind CSS

## 🛠️ Tech Stack

- **Frontend**: React 19 + Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router v6
- **Icons**: Lucide React
- **Backend**: Firebase (Auth + Firestore)
- **Deployment**: Vercel

## 📋 Prerequisites

- Node.js (v16+)
- npm or yarn
- Firebase account (free tier available)

## ⚙️ Installation & Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Firebase Configuration

1. **Create a Firebase Project**:
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Click "Create a new project"
   - Follow the setup wizard

2. **Enable Firebase Services**:
   - In Firebase Console, go to **Authentication**
   - Enable **Email/Password** sign-in method
   - Go to **Firestore Database**
   - Create a database in production mode
   - Create a database in test mode initially (for development)

3. **Get Your Firebase Credentials**:
   - Go to Project Settings (⚙️ icon)
   - Select your web app
   - Copy your Firebase config

4. **Create `.env.local` file** in the project root:
```bash
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 3. Create Firestore Collections

Run the following commands in Firestore console or use Firebase CLI:

```javascript
// Users Collection - for storing user profiles
db.collection('users').doc(uid).set({
  uid: string,
  name: string,
  email: string,
  role: 'user' | 'admin',
  savedProducts: array,
  createdAt: timestamp
})

// Products Collection - for storing product data
db.collection('products').doc().set({
  id: string,
  productName: string,
  category: string,
  ingredients: array,
  features: array,
  benefits: array,
  description: string,
  usageInstructions: string,
  imagePlaceholder: string,
  createdAt: timestamp
})

// Inquiries Collection - for storing user inquiries
db.collection('inquiries').doc().set({
  userId: string,
  name: string,
  email: string,
  phone: string,
  city: string,
  message: string,
  productId: string,
  productName: string,
  createdAt: timestamp
})

// Messages Collection - for contact form submissions
db.collection('messages').doc().set({
  name: string,
  email: string,
  subject: string,
  message: string,
  createdAt: timestamp
})
```

### 4. Set Firestore Security Rules

Copy these security rules to your Firestore:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Products - readable by everyone, writable by admins
    match /products/{document=**} {
      allow read: if true;
      allow write: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // Users - readable/writable by owner
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }

    // Inquiries - creatable by authenticated users, readable by owner or admin
    match /inquiries/{document=**} {
      allow create: if request.auth != null;
      allow read: if request.auth != null && (resource.data.userId == request.auth.uid || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
      allow delete: if request.auth != null && (resource.data.userId == request.auth.uid || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
    }

    // Messages - creatable by anyone
    match /messages/{document=**} {
      allow create: if true;
      allow read: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

## 🚀 Running the Application

### Development Server
```bash
npm run dev
```
The app will be available at `http://localhost:5173`

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Navbar/
│   ├── Footer/
│   ├── ProductCard/
│   ├── SearchBar/
│   ├── FilterPanel/
│   ├── InquiryForm/
│   ├── LoadingSpinner/
│   └── ProtectedRoute.jsx
├── pages/              # Page components
│   ├── Home.jsx
│   ├── Products.jsx
│   ├── ProductDetail.jsx
│   ├── About.jsx
│   ├── Contact.jsx
│   ├── Login.jsx
│   ├── Register.jsx
│   ├── Dashboard.jsx
│   └── Admin.jsx
├── context/            # React Context
│   └── AuthContext.jsx
├── firebase/           # Firebase configuration
│   └── config.js
├── data/               # Static data
│   └── products.js
├── utils/              # Utility functions
├── App.jsx             # Main app component
├── main.jsx            # Entry point
├── index.css           # Global styles
└── App.css             # Additional styles
```

## 👥 User Roles

### Regular User
- Browse and search products
- Save products to favorites
- Submit inquiries about products
- View personal dashboard
- Track inquiries and saved items

### Admin User
- All regular user features
- Manage products (add, edit, delete)
- View all users
- View and manage all inquiries
- Access admin dashboard

## 🔒 Creating an Admin User

1. Create a regular user account first
2. Go to Firebase Console > Firestore
3. Find the user's document in the `users` collection
4. Change the `role` field from `"user"` to `"admin"`

## 📦 Sample Data

The application comes with 25+ sample products across 4 categories:
- Cosmetics & Personal Care (6 products)
- Food Products (5 products)
- Nutrition & Wellness (5 products)
- Health & Wellness (5 products)

## 🎨 Customization

### Colors
Update Tailwind theme in `tailwind.config.js`:
- Primary: Emerald Green (#047857)
- Secondary: Dark Slate (#2d3748)
- Use Tailwind's color utilities for other colors

### Images
Replace placeholder images in `src/data/products.js` with actual image URLs.

## 🚀 Deployment to Vercel

1. **Push to GitHub**:
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/suraj-ventures.git
git push -u origin main
```

2. **Deploy to Vercel**:
   - Go to [Vercel Dashboard](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Add environment variables (Firebase config)
   - Click "Deploy"

3. **Environment Variables in Vercel**:
   - Go to Project Settings > Environment Variables
   - Add all Firebase config values with `VITE_` prefix

## 📋 Firestore Database Setup Checklist

- [ ] Create Firebase project
- [ ] Enable Authentication (Email/Password)
- [ ] Create Firestore database
- [ ] Create `users` collection
- [ ] Create `products` collection with sample data
- [ ] Create `inquiries` collection
- [ ] Create `messages` collection
- [ ] Set security rules
- [ ] Create admin user
- [ ] Add Firebase config to `.env.local`

## 🧪 Testing the Application

### Demo Credentials (if you created them)
- Email: demo@suraj.com
- Password: demo123456

### Test Flows
1. **User Registration & Login**: Register a new account and log in
2. **Product Search**: Search for products by ingredients
3. **Filtering**: Apply filters to narrow down results
4. **Bookmarking**: Save products to favorites
5. **Inquiries**: Submit inquiries for products
6. **Dashboard**: View saved products and inquiries
7. **Admin Access**: Create an admin account and test admin panel

## 📱 Browser Compatibility

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For issues, questions, or suggestions, please create an issue in the repository.

## 🎯 Future Enhancements

- [ ] Product comparison feature
- [ ] User reviews and ratings
- [ ] Wishlist functionality
- [ ] Product recommendations
- [ ] Social sharing
- [ ] Mobile app
- [ ] Email notifications
- [ ] Payment integration (future)
- [ ] Barcode scanning
- [ ] AR try-on feature

## 🔐 Security Notes

- Never commit `.env.local` file
- Always use Firestore security rules
- Enable HTTPS on production
- Use strong passwords
- Keep Firebase config keys secure
- Regularly update dependencies

---

**Made with ❤️ for conscious consumers**
