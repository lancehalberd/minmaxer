type JobKey = string;//'archer' | 'buildWall' | 'repairWall' | 'harvestWood';

type ResourceCost<T> = {
    [key in InventoryKey]?: Computed<number, T>
}
type ComputedResourceCost = {
    [key in InventoryKey]?: number
}

interface Requirements {
    toolType?: ToolType
    resourceCost?: {[key in InventoryKey]?: number}
    essenceCost?: number
}

interface JobDefinition {
    key: JobKey
    labelIcon?: Frame
    label: Computed<string, JobDefinition>
    // The level of the job for job's with multiple levels.
    level?: number
    // Which resources must be consumed in order to start this job.
    resourceCost?: Computed<ResourceCost<JobDefinition>, JobDefinition>
    essenceCost?: Computed<number, JobDefinition>
    requiredToolType?: ToolType
    // The default number of seconds it takes a single worker to complete this job by default.
    workerSeconds?: Computed<number, JobDefinition>
    // If true the job will repeat when completed.
    repeat?: boolean
    // If this is set and returns true, then the job should be hidden from the UI and
    // all work should be stopped.
    isValid?: (state: GameState) => boolean
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
    isPaidFor: boolean
    // Controls whether the job should be repeated.
    shouldRepeatJob: boolean
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
    idleToolCounts: {[key in ToolType]: number}
    jobs: {
        [key in JobKey]: Job
    }
    wall: CityWallStats
    // Number of people assigned as archers.
    archersTarget?: EnemyTarget
    archersLastAttackTime?: number
}

interface CityWallStats {
    level: number
    maxHealth: number
    health: number
    returnDamage: number
}

