import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import publicService from '@/services/publicService';

export const GlobalSiteSettings: React.FC = () => {
    const { data: settingsResponse } = useQuery({
        queryKey: ["publicSiteSettings"],
        queryFn: async () => {
            const response = await publicService.getSiteSettings();
            return response.data;
        },
        staleTime: 5 * 60 * 1000,
    });

    const settings = settingsResponse?.data;

    useEffect(() => {
        if (settings?.favicon_url) {
            let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
            if (!link) {
                link = document.createElement('link');
                link.rel = 'icon';
                document.head.appendChild(link);
            }
            link.href = settings.favicon_url;
            link.removeAttribute('type');
            
            let shortcutLink = document.querySelector("link[rel='shortcut icon']") as HTMLLinkElement;
            if (!shortcutLink) {
                shortcutLink = document.createElement('link');
                shortcutLink.rel = 'shortcut icon';
                document.head.appendChild(shortcutLink);
            }
            shortcutLink.href = settings.favicon_url;
            shortcutLink.removeAttribute('type');
        }

        if (settings?.site_name) {
            document.title = settings.site_name;
        }
    }, [settings?.favicon_url, settings?.site_name]);

    return null;
};
