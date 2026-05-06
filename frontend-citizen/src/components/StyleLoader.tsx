import { useEffect } from 'react';
import { getAllElementStyles } from '../services/api';

/**
 * StyleLoader - Loads and applies saved element styles from database
 * This runs for ALL users (admin and citizens) to apply published changes
 */
export const StyleLoader = () => {
    useEffect(() => {
        const loadStyles = async () => {
            try {
                const styles = await getAllElementStyles();

                // Create or get the style tag
                let styleTag = document.getElementById('visual-builder-override-styles');
                if (!styleTag) {
                    styleTag = document.createElement('style');
                    styleTag.id = 'visual-builder-override-styles';
                    document.head.appendChild(styleTag);
                }

                // Generate CSS rules
                // We use !important to ensure these override default styles
                const cssRules = styles.map((style: any) => {
                    // Ensure the selector is safe and wrap cssText in a block
                    // We assume style.css_text is a list of properties like "color: red; font-size: 20px;"
                    // We need to append !important to each property for guaranteed override

                    const properties = style.css_text.split(';').filter((p: string) => p.trim());
                    const importantProperties = properties.map((p: string) => {
                        if (p.toLowerCase().includes('!important')) return p;
                        return `${p} !important`;
                    }).join(';');

                    return `${style.element_selector} { ${importantProperties} }`;
                }).join('\n');

                styleTag.textContent = cssRules;
                console.log(`🎨 Injected ${styles.length} custom style rules.`);

            } catch (error) {
                console.error('Failed to load styles:', error);
            }
        };

        loadStyles();

        // No cleanup needed as we want styles to persist, 
        // but if we wanted to be strict we could remove the tag on unmount.
        // For a global loader, keeping it is fine.
    }, []);

    return null; // This component doesn't render anything
};