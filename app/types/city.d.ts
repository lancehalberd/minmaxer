interface CityWallStats {
    level: number
    maxHealth: number
    health: number
    returnDamage: number
}

type JobKey = 'archer' | 'buildWall';
type ResourceKey = 'wood' | 'hardWood' | 'stone' | 'ironOre';
type ToolType = 'hammer' | 'axe' | 'bow';
type HammerType = 'woodHammer' | 'stoneHammer' | 'ironHammer' | 'steelHammer';
type AxeType = 'woodHatchet' | 'stoneHatchet' | 'ironHatchet' | 'steelHatchet';
type BowType = 'shortBow' | 'longBow' | 'crossBow';
type AmmoTyoe = 'arrow';
type ArrowType = 'woodArrow' | 'flintArrow' | 'ironArrow' | 'steelArrow';

type InventoryKey = ResourceKey | HammerType;


type ResourceCost = {
    [key in ResourceKey]?: number
}

interface JobDefinition {
    key: JobKey
    // The level of the job for job's with multiple levels.
    level?: number
    // Which resources must be consumed in order to start this job.
    resourceCost?: ResourceCost
    // The default number of seconds it takes a single worker to complete this job by default.
    workerSeconds?: number
    // If true the job will repeat when completed.
    repeat?: boolean
    update?: (state: GameState, job: Job) => void
    onComplete?: (state: GameState, job: Job, completons: number) => void
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

interface Inventory {
    // Raw resources
    wood: number
    hardWood: number
    stone: number
    ironOre: number

    // Wood chopping tools
    woodHatchet: number
    stoneHatchet: number
    ironHatchet: number
    steelHatchet: number

    // Building tools
    woodHammer: number
    stoneHammer: number
    ironHammer: number
    steelHammer: number

    // Archery weapons
    shortBow: number
    longBow: number
    crossBow: number

    // Archery ammunition
    woodArrow: number
    flintArrow: number
    ironArrow: number
    steelArrow: number
}
