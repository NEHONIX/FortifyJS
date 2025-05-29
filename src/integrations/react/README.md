# Nehonix FortifyJS React Integration

FortifyJS React provides a suite of hooks and components for secure state management, data handling, and form processing in React applications. Designed to integrate with the core FortifyJS library (`fortify2-js`), this package enables developers to build secure, type-safe applications with features like automatic encryption and sensitive data management.

## Architecture

The React integration follows a modular design for maintainability and scalability:

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

## Features

### Hooks

-   **`useSecureState`**: Manages state with automatic encryption and sensitive key protection.
-   **`useSecureObject`**: Provides enhanced object manipulation with FortifyJS’s `SecureObject` capabilities.
-   **`useSecureForm`**: Handles form validation and secure data processing.
-   **`useSecureStorage`**: Encrypts data stored in `localStorage` or `sessionStorage`.
-   **`useSecureEffect`**: Executes side effects with integrated security monitoring.

### Components

-   **`<SecureProvider>`**: Establishes a global security context for the application.
-   **`<SecureForm>`**: Renders forms with built-in security and validation.
-   **`<SecureInput>`**: Provides secure input fields with automatic sensitive data handling.

### Context

-   **`SecurityContext`**: Configures app-wide security settings.
-   **`useSecurityContext`**: Retrieves security configuration within components.

## Installation

Install the FortifyJS React integration package:

```bash
npm install fortify2-js-react
```

Ensure the core FortifyJS library is installed, as it is a peer dependency:

```bash
npm install fortify2-js
```

Verify that React and React DOM are installed in your project:

```bash
npm install react react-dom
```

## Usage Examples

### Secure State Management

```tsx
import { useSecureState, SecureProvider } from "fortifyjs-react";

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
```

### Object Manipulation

```tsx
import { useSecureObject } from "fortifyjs-react";

function DataProcessor({ rawData }) {
    const data = useSecureObject(rawData);

    const processedData = data
        .filterNonSensitive()
        .transform((value) =>
            typeof value === "string" ? value.toUpperCase() : value
        )
        .compact();

    return <div>{processedData.size} items processed</div>;
}
```

### Application Setup

```tsx
import { SecureProvider } from "fortifyjs-react";

function App() {
    return (
        <SecureProvider config={{ encryptionLevel: "high" }}>
            <UserProfile />
            <DataProcessor rawData={{ name: "John", token: "abc123" }} />
        </SecureProvider>
    );
}
```

### Secure Form Handling

```tsx
import { SecureForm, SecureInput } from "fortifyjs-react";

function LoginForm() {
    return (
        <SecureForm
            onSubmit={(data) => console.log("Submitted:", data.getAll())}
            sensitiveKeys={["password"]}
        >
            <SecureInput name="username" type="text" />
            <SecureInput name="password" type="password" />
            <button type="submit">Login</button>
        </SecureForm>
    );
}
```

## Configuration Options

The `SecureProvider` and hooks accept configuration options to customize security behavior:

```tsx
<SecureProvider
    config={{
        encryptionLevel: "high", // Options: "basic", "enhanced", "high", "maximum"
        encryptionKey: "my-secret-key", // Optional encryption key
        autoLock: true, // Automatically lock sensitive data
        quantumSafe: false, // Enable quantum-resistant algorithms
    }}
>
    <App />
</SecureProvider>
```

Hook-specific options:

```tsx
const [state, setState] = useSecureState(initialData, {
    sensitiveKeys: ["apiKey", "token"], // Mark fields as sensitive
    autoEncrypt: true, // Encrypt sensitive data automatically
    readOnly: false, // Allow state modifications
});
```

## Advanced Usage

### Secure Storage

```tsx
import { useSecureStorage } from "fortifyjs-react";

function SettingsManager() {
    const [settings, setSettings] = useSecureStorage(
        "appSettings",
        {
            theme: "light",
            apiKey: "sk-1234567890",
        },
        {
            storageType: "localStorage", // or "sessionStorage"
            sensitiveKeys: ["apiKey"],
        }
    );

    const updateTheme = () => {
        settings.set(
            "theme",
            settings.get("theme") === "light" ? "dark" : "light"
        );
        setSettings(settings);
    };

    return <button onClick={updateTheme}>Toggle Theme</button>;
}
```

### Security Context

```tsx
import { useSecurityContext } from "fortifyjs-react";

function SecurityStatus() {
    const { config, verifyRuntimeSecurity } = useSecurityContext();

    const checkSecurity = () => {
        const status = verifyRuntimeSecurity();
        console.log(
            "Security Level:",
            config.encryptionLevel,
            "Status:",
            status
        );
    };

    return <button onClick={checkSecurity}>Check Security</button>;
}
```

## Best Practices

1. **Wrap Applications in `SecureProvider`**:

    ```tsx
    <SecureProvider config={{ encryptionLevel: "high" }}>
        <App />
    </SecureProvider>
    ```

2. **Mark Sensitive Data**:

    ```tsx
    const [data] = useSecureState(
        { password: "secret" },
        { sensitiveKeys: ["password"] }
    );
    ```

3. **Clean Up Resources**:

    ```tsx
    import { useEffect } from "react";
    import { useSecureObject } from "fortifyjs-react";

    function Component() {
        const data = useSecureObject({ token: "abc123" });
        useEffect(() => () => data.destroy(), [data]);
        return <div>{data.get("token")}</div>;
    }
    ```

4. **Use TypeScript for Safety**:

    ```tsx
    interface UserData {
        name: string;
        email: string;
        password: string;
    }

    const [user] = useSecureState<UserData>({
        name: "John",
        email: "john@example.com",
        password: "secret",
    });
    ```

5. **Monitor Performance**:
    ```tsx
    const data = useSecureObject({ key: "value" });
    data.startPerformanceMonitoring();
    console.log(data.getPerformanceStats());
    ```

## Documentation

Detailed guides are available for each module:

-   [Hooks Documentation](./hooks/README.md)
-   [Components Documentation](./components/README.md)
-   [Context Documentation](./context/README.md)

## Integration with FortifyJS Core

The React integration leverages FortifyJS’s core features, such as `SecureObject` and `SecureString`, ensuring compatibility:

```tsx
import { fObject } from "fortify2-js";
import { useSecureObject } from "fortifyjs-react";

function Component() {
    const coreObject = fObject({ key: "value" });
    const reactObject = useSecureObject(coreObject);
    return <div>{reactObject.get("key")}</div>;
}
```

## License

MIT License - see [LICENSE](LICENSE) for details.

## Links

-   GitHub: [https://github.com/nehonix/fortifyjs](https://github.com/nehonix/fortifyjs)
-   NPM: [https://www.npmjs.com/package/fortifyjs-react](https://www.npmjs.com/package/fortifyjs-react)
-   Core Documentation: [https://lab.nehonix.space](https://lab.nehonix.space)
