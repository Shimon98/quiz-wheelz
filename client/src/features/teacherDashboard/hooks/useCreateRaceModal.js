import { useState } from "react";

export function useCreateRaceModal() {
    const [isCreateRaceModalOpen, setIsCreateRaceModalOpen] = useState(false);

    function openCreateRaceModal() {
        setIsCreateRaceModalOpen(true);
    }

    function closeCreateRaceModal() {
        setIsCreateRaceModalOpen(false);
    }

    return {
        isCreateRaceModalOpen,
        openCreateRaceModal,
        closeCreateRaceModal,
    };
}
