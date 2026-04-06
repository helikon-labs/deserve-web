import './style/style.css';
import { App } from '@/app';

let app: App | undefined;

async function bootstrap() {
    if (!app) {
        app = new App();
        await app.setup();
        app.start();
    }
}

await bootstrap();

if (import.meta.hot) {
    import.meta.hot.dispose(() => {
        try {
            app?.stop();
        } finally {
            app = undefined;
        }
    });

    // re-evaluate this module on update - top-level bootstrap() will run again
    import.meta.hot.accept();
}
