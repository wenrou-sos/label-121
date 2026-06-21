import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Team } from '../types';

interface FavoriteState {
  favoriteTeams: Team[];
  addFavorite: (team: Team) => void;
  removeFavorite: (teamId: string) => void;
  toggleFavorite: (team: Team) => void;
  isFavorite: (teamId: string) => boolean;
}

export const useFavoriteStore = create<FavoriteState>()(
  persist(
    (set, get) => ({
      favoriteTeams: [],

      addFavorite: (team: Team) => {
        const exists = get().favoriteTeams.some(t => t.id === team.id);
        if (!exists) {
          set({ favoriteTeams: [...get().favoriteTeams, team] });
        }
      },

      removeFavorite: (teamId: string) => {
        set({ favoriteTeams: get().favoriteTeams.filter(t => t.id !== teamId) });
      },

      toggleFavorite: (team: Team) => {
        if (get().isFavorite(team.id)) {
          get().removeFavorite(team.id);
        } else {
          get().addFavorite(team);
        }
      },

      isFavorite: (teamId: string) => {
        return get().favoriteTeams.some(t => t.id === teamId);
      }
    }),
    {
      name: 'favorite-teams-storage',
      storage: createJSONStorage(() => localStorage)
    }
  )
);
