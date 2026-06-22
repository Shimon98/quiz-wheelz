

import { UI_CLASSES } from '../../styles/theme.js';

export default function FormError({ message }) {
    return (
        <div className="min-h-12">
            {message && (
                <div className={UI_CLASSES.formError}>
                    {message}
                </div>
            )}
        </div>
    );
}
