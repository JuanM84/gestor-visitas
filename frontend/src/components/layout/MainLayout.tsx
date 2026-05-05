import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';

interface MainLayoutProps {
    children: ReactNode;
}

export const MainLayout = ({ children }: MainLayoutProps) => {
    return (
        <div className="flex min-h-screen bg-background">
            <Sidebar />
            <div className="flex-1 flex flex-col md:ml-64">
                <Navbar />
                <main className="p-margin max-w-[1440px] mx-auto w-full flex flex-col gap-lg pb-xl">
                    {children}
                </main>
            </div>
        </div>
    );
};