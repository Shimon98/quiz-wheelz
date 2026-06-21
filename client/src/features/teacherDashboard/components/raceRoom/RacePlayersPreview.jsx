export default function RacePlayersPreview({ players = [], content }) {
    const hasPlayers = players.length > 0;

    return (
        <section className="rounded-3xl bg-white/85 p-6 text-start shadow-[0_10px_28px_rgba(27,42,65,0.08)]">
            <h2 className="text-xl font-extrabold text-slate-900">
                {content.playersTitle}
            </h2>

            {!hasPlayers && (
                <div className="mt-5 flex min-h-32 items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm font-bold text-slate-500">
                    {content.playersEmpty}
                </div>
            )}

            {hasPlayers && (
                <div className="mt-5 grid gap-3">
                    {players.map((player, index) => (
                        <div
                            key={player.playerId ?? player.id ?? index}
                            className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3"
                        >
                            <span className="font-extrabold text-slate-800">
                                {player.displayName ??
                                    player.name ??
                                    `${content.playerNameFallback} ${index + 1}`}
                            </span>
                            <span className="text-xs font-bold text-emerald-600">
                                {content.joinedLabel}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}
