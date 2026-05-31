import React, { Suspense } from 'react';
import { useModalStore } from '@/store/modalStore';

// Dynamic registry of all modals.
// Keys should match the modal IDs (e.g. 'setupPeriode', 'gantiPassword')
const MODAL_COMPONENTS: Record<string, React.LazyExoticComponent<React.ComponentType<any>>> = {
    setupPeriode: React.lazy(() => 
        import('@/components/modals/SetupPeriodeModal').then(module => ({ default: module.SetupPeriodeModal }))
    ),
    // Example for future modals:
    // gantiPassword: React.lazy(() => import('@/components/modals/GantiPasswordModal').then(m => ({ default: m.GantiPasswordModal }))),
};

export function ModalProvider() {
    const { modals } = useModalStore();

    return (
        <>
            {Object.entries(modals).map(([id, isOpen]) => {
                // Hati-hati, jika false tidak perlu dirender sama sekali
                if (!isOpen) return null;
                
                const ModalComponent = MODAL_COMPONENTS[id];
                if (!ModalComponent) {
                    console.warn(`Modal component for id "${id}" not found in ModalProvider registry.`);
                    return null;
                }

                return (
                    <Suspense key={id} fallback={null}>
                        <ModalComponent />
                    </Suspense>
                );
            })}
        </>
    );
}
