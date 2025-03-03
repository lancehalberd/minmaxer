
interface LocationTarget extends Point {
    objectType: 'point'
    r: 0
}

type AllyTarget = Hero | Nexus;
type EnemyTarget = Enemy | Spawner;

// Any target on the field.
type FieldTarget = LocationTarget | Hero | Enemy | Spawner | WaveSpawner | Nexus | Loot | Structure;

// Any target that an ability could theoretically target.
type AbilityTarget = FieldTarget;

// A target that can be attacked.
type AttackTarget = AllyTarget | EnemyTarget;

// This will eventually include clickable targets like buttons or interactive objects.
type MouseTarget = UIElement | FieldTarget;
