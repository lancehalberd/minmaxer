interface CityWallStats {
    level: number
    maxHealth: number
    health: number
    returnDamage: number
}

type JobKey = 'archer' | 'buildWall' | 'repairWall';
type ResourceKey = 'wood' | 'hardWood' | 'stone' | 'ironOre';
type ToolType = 'hammer' | 'axe' | 'bow';
type HammerType = 'woodHammer' | 'stoneHammer' | 'ironHammer' | 'steelHammer';
type AxeType = 'woodHatchet' | 'woodAxe' | 'stoneAxe' | 'ironHatchet' | 'steelAxe';
type BowType = 'shortBow' | 'longBow' | 'crossBow';
type AmmoType = 'arrow';
type ArrowType = 'woodArrow' | 'flintArrow' | 'ironArrow' | 'steelArrow';

type InventoryKey = ResourceKey | AxeType | BowType | HammerType | ArrowType;

type Inventory = {
    [key in InventoryKey]: number
};

type ResourceCost = {
    [key in ResourceKey]?: number
}

interface JobDefinition {
    key: JobKey
    label: string
    // The level of the job for job's with multiple levels.
    level?: number
    // Which resources must be consumed in order to start this job.
    resourceCost?: ResourceCost
    essenceCost?: number
    requiredToolType?: ToolType
    // The default number of seconds it takes a single worker to complete this job by default.
    workerSeconds?: number
    // If true the job will repeat when completed.
    repeat?: boolean
    // This can be set to freeze job progress in certain circumstances.
    // For example, the repair wall job will freeze when the wall has full health.
    canProgress?: (state: GameState, job: Job) => boolean
    update?: (state: GameState, job: Job) => void
    onComplete?: (state: GameState, job: Job) => void
}

interface Job {
    definition: JobDefinition
    workers: number
    workerSecondsCompleted: number
}

interface CityStats {
    maxPopulation: number
    population: number
    jobs: {
        [key in JobKey]?: Job
    }
    wall: CityWallStats
    // Number of people assigned as archers.
    archersTarget?: EnemyTarget
    archersLastAttackTime?: number
}

