import {damageTarget, getAllyTargets, getEnemyTargets, getTargetsInCircle} from 'app/utils/combat';
import {removeEffect} from 'app/utils/effect';
import {frameLength} from 'app/gameConstants';

interface ProjectileProps extends Partial<Projectile> {
    zone: ZoneInstance
}

export function createProjectile(props: ProjectileProps): Projectile {
    const projectile: Projectile = {
        objectType: 'projectile',
        x: 0, y: 0,
        vx: 0, vy: 0,
        r: 10,
        duration: 1000,
        update: updateProjectile,
        render: renderProjectile,
        missedTargets: new Set(),
        hitTargets: new Set(),
        hit: props.hit ?? {damage: 1},
        ...props,
    };
    return projectile;
}
export function addProjectile(state: GameState, props: ProjectileProps): Projectile {
    const projectile = createProjectile(props);
    projectile.zone.effects.push(projectile);
    return projectile;
}

function updateProjectile(this: Projectile, state: GameState) {
    this.duration -= frameLength;
    if (this.duration < 0) {
        this.onExpire?.(state);
        removeEffect(state, this);
        return;
    }
    this.x += this.vx * frameLength / 1000;
    this.y += this.vy * frameLength  / 1000;
    checkIfProjectileHitTargets(state, this);
}

function checkIfProjectileHitTargets(state: GameState, projectile: Projectile) {
    let targets: AttackTarget[] = [];
    if (projectile.hitsNexus) {
        targets.push(state.nexus);
    }
    if (projectile.hitsEnemies) {
        targets = [...targets, ...getEnemyTargets(state, projectile.zone)];
    }
    if (projectile.hitsAllies) {
        targets = [...targets, ...getAllyTargets(state, projectile.zone)];
    }
    projectile.missedTargets = new Set(targets);
    for (const target of getTargetsInCircle(state, targets, projectile)) {
        projectile.missedTargets.delete(target);
        if (projectile.hitTargets.has(target)) {
            continue;
        }
        damageTarget(state, target, projectile.hit);
        projectile.hitTargets.add(target);
        projectile.onHit?.(state, target);
    }
    if (!projectile.piercing && projectile.hitTargets.size) {
        projectile.onExpire?.(state);
        removeEffect(state, projectile);
    }
}



// Default projectile is just a triangle with a point towards its heading.
function renderProjectile(this: Projectile, context: CanvasRenderingContext2D, state: GameState) {
    const theta = Math.atan2(this.vy, this.vx);
    context.save();
        context.fillStyle = this.color || '#F80';
        context.translate(this.x, this.y);
        context.rotate(theta);
        context.beginPath();
        context.moveTo(this.r, 0);
        context.lineTo(-this.r / 2, Math.sqrt(3) * this.r / 2);
        context.lineTo(-this.r / 2, -Math.sqrt(3) * this.r / 2);
        context.fill();
    context.restore();
}

interface OrbitingProjectileProps extends Partial<Projectile> {
    hit: AttackHit
    target: AbilityTarget
    theta: number
    vTheta: number
    orbitRadius: number
}
export class OrbitingProjectile implements Projectile {
    objectType = <const>'projectile'
    zone = this.props.target.zone;
    x = this.props.x ?? 0;
    y = this.props.y ?? 0;
    vx = 0;
    vy = 0;
    r = this.props.r ?? 5;
    color = this.props.color;
    originalTheta = this.props.theta;
    theta = this.props.theta;
    vTheta = this.props.vTheta;
    orbitRadius = this.props.orbitRadius;
    duration = this.props.duration ?? 0;
    piercing = this.props.piercing ?? true;
    hit = this.props.hit;
    hitsEnemies = this.props.hitsEnemies;
    hitsAllies = this.props.hitsAllies;
    target = this.props.target;
    onHit = this.props.onHit;
    onExpire = this.props.onExpire;
    render = this.props.render ?? renderProjectile;
    creator = this.props.creator;
    missedTargets = new Set<AbilityTarget>();
    hitTargets = new Set<AbilityTarget>();
    time = 0;
    constructor(public props: OrbitingProjectileProps) {
        this.zone.effects.push(this);
        this.setPosition();
    }
    update(state: GameState) {
        this.time += frameLength;
        this.theta += this.vTheta * frameLength / 1000;
        this.setPosition();
        checkIfProjectileHitTargets(state, this);
        // Any target missed this frame becomes available to hit again in the future.
        for (const target of this.missedTargets) {
            this.hitTargets.delete(target);
        }
    }
    setPosition() {
        this.x = this.target.x + ((this.target.r ?? 0) + this.orbitRadius) * Math.cos(this.theta);
        this.y = this.target.y + ((this.target.r ?? 0) + this.orbitRadius) * Math.sin(this.theta);
    }
}
