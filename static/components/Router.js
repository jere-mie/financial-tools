import { h, useState, useEffect } from '../vendor/standalone-preact.esm.js';

export function Router({ routes }) {
    const getPath = () => window.location.hash.slice(1) || '/';
    const [currentPath, setCurrentPath] = useState(getPath());

    useEffect(() => {
        const handleHashChange = () => {
            setCurrentPath(getPath());
        };

        window.addEventListener('hashchange', handleHashChange);
        return () => {
            window.removeEventListener('hashchange', handleHashChange);
        };
    }, []);

    const route = routes.find(r => r.path === currentPath);
    const notFoundRoute = routes.find(r => r.path === '*');
    const Component = route ? route.component : (notFoundRoute ? notFoundRoute.component : routes.find(r => r.path === '/').component);
    
    return h(Component, null);
}
