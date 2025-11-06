"use client"

const Annonces = () => {
  return (
    <div className="bg-card p-4 rounded-md">
        <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold">Annonces</h1>
            <span className="text-xs text-muted-foreground">Vour tout</span>
        </div>
        <div className="flex flex-col gap-4">
            <div className="bg-fmkSkyLight rounded-md p-4">
                 <div className="flex items-center justify-between">
                    <h2 className="font-medium">Prochaines MEP</h2>
                    <span className="text-xs text-muted-foreground bg-card rounded-md px-1 py-1">01/01/2025</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                    Lorem ipsum dolor sit amet consectetur adipisicing elit Pariatur ullam soluta saepe quisquam quasi rem commodi veritatis itaque dolores repellat quam at aperiam.",
                </p>
            </div>
            <div className="bg-primary/10 rounded-md p-4">
                 <div className="flex items-center justify-between">
                    <h2 className="font-medium">HotFix</h2>
                    <span className="text-xs text-muted-foreground bg-card rounded-md px-1 py-1">01/01/2025</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                    Lorem ipsum dolor sit amet consectetur adipisicing elit Pariatur ullam soluta saepe quisquam quasi rem commodi veritatis itaque dolores repellat quam at aperiam.",
                </p>
            </div>
            <div className="bg-accent/50 rounded-md p-4">
                 <div className="flex items-center justify-between">
                    <h2 className="font-medium">Change techique</h2>
                    <span className="text-xs text-muted-foreground bg-card rounded-md px-1 py-1">01/01/2025</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                    Lorem ipsum dolor sit amet consectetur adipisicing elit Pariatur ullam soluta saepe quisquam quasi rem commodi veritatis itaque dolores repellat quam at aperiam.",
                </p>
            </div>
            <div className="bg-accent/50 rounded-md p-4">
                 <div className="flex items-center justify-between">
                    <h2 className="font-medium">Divers</h2>
                    <span className="text-xs text-muted-foreground bg-card rounded-md px-1 py-1">01/01/2025</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                    Lorem ipsum dolor sit amet consectetur adipisicing elit Pariatur ullam soluta saepe quisquam quasi rem commodi veritatis itaque dolores repellat quam at aperiam.",
                </p>
            </div>
        </div>
    </div>
  )
}

export default Annonces