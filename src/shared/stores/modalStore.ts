import { create } from "zustand";

interface ModalStore {
    modals: Record<string, boolean>;
    openModal: ( id: string ) => void;
    closeModal: ( id: string ) => void;
    toggleModal: ( id: string ) => void;
}

export const useModalStore = create<ModalStore>( ( set ) => ( {
    modals: {},
    openModal: ( id: string ) =>
        set( ( state ) => ( {
            modals: { ...state.modals, [ id ]: true },
        } ) ),
    closeModal: ( id: string ) =>
        set( ( state ) => ( {
            modals: { ...state.modals, [ id ]: false },
        } ) ),
    toggleModal: ( id: string ) =>
        set( ( state ) => ( {
            modals: { ...state.modals, [ id ]: !state.modals[ id ] },
        } ) ),
} ) );
