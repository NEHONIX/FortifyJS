# FortifyJS React Integration

**Modular React hooks and components for secure, powerful state management**

## 📁 **Modular Architecture**

```
src/integrations/react/
├── hooks/                    # React hooks
│   ├── core/                # Core hook implementations
│   ├── state/               # State management hooks
│   ├── object/              # Object manipulation hooks
│   └── index.ts             # Hook exports
├── components/              # React components
│   ├── providers/           # Context providers
│   ├── forms/               # Secure form components
│   └── index.ts             # Component exports
├── context/                 # React contexts
│   ├── security-context.ts  # Global security context
│   └── index.ts             # Context exports
├── types/                   # TypeScript types
│   ├── hooks.ts             # Hook-specific types
│   ├── components.ts        # Component types
│   └── index.ts             # Type exports
├── utils/                   # React-specific utilities
│   ├── react-helpers.ts     # React utility functions
│   └── index.ts             # Utility exports
└── index.ts                 # Main exports
```

## 🎯 **Features**

### **Hooks**

-   `useSecureState()` - Secure state with automatic encryption
-   `useSecureObject()` - Enhanced object state management
-   `useSecureForm()` - Form validation with security
-   `useSecureStorage()` - Encrypted localStorage/sessionStorage
-   `useSecureEffect()` - Effects with security monitoring

### **Components**

-   `<SecureProvider>` - Global security context
-   `<SecureForm>` - Forms with built-in security
-   `<SecureInput>` - Secure input components

### **Context**

-   `SecurityContext` - App-wide security configuration
-   `useSecurityContext()` - Access security settings

## **Usage Examples**

```tsx
import {
    useSecureState,
    useSecureObject,
    SecureProvider,
} from "fortify2-js/react";

// Secure state management
function UserProfile() {
    const [user, setUser] = useSecureState(
        {
            name: "John",
            email: "john@example.com",
            password: "secret123",
        },
        {
            sensitiveKeys: ["password"],
            autoEncrypt: true,
        }
    );

    return <div>{user.get("name")}</div>;
}

// Enhanced object operations
function DataProcessor() {
    const data = useSecureObject(rawData);

    const processedData = data
        .filterNonSensitive()
        .transform((value) => value.toUpperCase())
        .compact();

    return <div>{processedData.size} items processed</div>;
}

// Global security provider
function App() {
    return (
        <SecureProvider config={{ encryptionLevel: "military" }}>
            <UserProfile />
            <DataProcessor />
        </SecureProvider>
    );
}
```

## 🔧 **Installation**

```bash
npm install fortify2-js
# React hooks are included in the main package
```

## 📚 **Documentation**

See individual module READMEs for detailed documentation:

-   [Hooks Documentation](./hooks/README.md)
-   [Components Documentation](./components/README.md)
-   [Context Documentation](./context/README.md)

