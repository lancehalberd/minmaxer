
interface LocationTarget extends ZoneLocation {
    objectType: 'point'
    r?: 0
}

// Nexus is handled separately from ally targets.
type SpecialTarget = Nexus;
type AllyTarget = Hero | Ally;
type EnemyTarget = Enemy | Spawner;

// Any target on the field.
type FieldTarget = SpecialTarget | AllyTarget | EnemyTarget | LocationTarget | WaveSpawner | Loot | Structure;

// Any target that an ability could theoretically target.
type AbilityTarget = FieldTarget;

// A target that can be attacked.
type AttackTarget = SpecialTarget | AllyTarget | EnemyTarget;

// This will eventually include clickable targets like buttons or interactive objects.
type MouseTarget = UIElement | FieldTarget;
