interface CityWallStats {
    level: number
    maxHealth: number
    health: number
    returnDamage: number
}

type JobKey = string;//'archer' | 'buildWall' | 'repairWall' | 'harvestWood';
type ResourceKey = 'wood' | 'hardwood' | 'stone' | 'ironOre';
type ToolType = 'hammer' | 'axe' | 'bow' | 'staff';
type HammerType = 'woodHammer' | 'stoneHammer' | 'ironHammer' | 'steelHammer';
type AxeType = 'woodHatchet' | 'woodAxe' | 'stoneAxe' | 'ironHatchet' | 'steelAxe';
type BowType = 'shortBow' | 'longBow' | 'crossBow';
type StaffType = 'woodStaff' | 'bronzeStaff' | 'steelStaff';
type AmmoType = 'arrow';
type ArrowType = 'woodArrow' | 'flintArrow' | 'ironArrow' | 'steelArrow';

type InventoryKey = ResourceKey
    | AxeType | HammerType
    | BowType | StaffType
    | ArrowType;

type Inventory = {
    [key in InventoryKey]: number
};

type ResourceCost<T> = {
    [key in ResourceKey]?: Computed<number, T>
}
type ComputedResourceCost = {
    [key in ResourceKey]?: number
}

interface JobDefinition {
    key: JobKey
    label: string
    // The level of the job for job's with multiple levels.
    level?: number
    // Which resources must be consumed in order to start this job.
    resourceCost?: ResourceCost<JobDefinition>
    essenceCost?: Computed<number, JobDefinition>
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
    // Function called each tick for each hero working on this job.
    applyHeroProgress?: (state: GameState, job: Job, hero: Hero) => void
}

interface Job {
    definition: JobDefinition
    // Whether this job has been paid for already.
    isPaidFor?: boolean
    workers: number
    workerSecondsCompleted: number
    // Circle a hero must be in range of to participate in this job.
    // For example, this is the Nexus for city jobs, or the forest for gathering wood.
    getHeroTarget?: (state: GameState) => FieldTarget
}

interface JobUIElement extends UIContainer {
    jobDefinition: JobDefinition
}

interface CityStats {
    maxPopulation: number
    population: number
    idlePopulation: number
    jobs: {
        [key in JobKey]: Job
    }
    wall: CityWallStats
    // Number of people assigned as archers.
    archersTarget?: EnemyTarget
    archersLastAttackTime?: number
}

