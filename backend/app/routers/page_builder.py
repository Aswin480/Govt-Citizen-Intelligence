from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from app.db.database import get_db
from app.models.dynamic_component import DynamicComponent
from app.core.security_deps import verify_admin
from app.core.cache import get_cache, set_cache, delete_cache
from pydantic import BaseModel
from datetime import datetime

router = APIRouter(
    prefix="/page-builder",
    tags=["page-builder"]
)

# Pydantic Models
class ComponentCreate(BaseModel):
    type: str # 'button', 'card', 'alert', 'container', 'divider'
    content: str
    props: Dict[str, Any] = {}
    style: Dict[str, Any] = {}
    parent_id: str
    order: int = 0

class ComponentResponse(BaseModel):
    id: int
    type: str
    content: str
    props: Dict[str, Any]
    style: Dict[str, Any]
    parent_id: str
    order: int
    created_at: datetime
    created_by: str

    class Config:
        from_attributes = True

@router.post("/components", response_model=ComponentResponse)
def create_component(
    component: ComponentCreate,
    db: Session = Depends(get_db),
    admin: dict = Depends(verify_admin)
):
    """Create a new dynamic component (Admin only)"""
    new_component = DynamicComponent(
        type=component.type,
        content=component.content,
        props=component.props,
        style=component.style,
        parent_id=component.parent_id,
        order=component.order,
        created_by=admin.get("sub", "admin")
    )
    db.add(new_component)
    db.commit()
    db.refresh(new_component)
    
    # Invalidate cache for this parent
    delete_cache(f"components:{component.parent_id}")
    
    return new_component

@router.get("/components", response_model=List[ComponentResponse])
def get_components(
    parent_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get all components, optionally filtered by parent constainer"""
    # 1. Check Cache
    cache_key = f"components:{parent_id}" if parent_id else "components:all"
    cached_data = get_cache(cache_key)
    if cached_data:
        # print(f"⚡ Cache Hit: {cache_key}")
        return [ComponentResponse(**item) for item in cached_data]

    # 2. Database Fallback
    try:
        query = db.query(DynamicComponent)
        if parent_id:
            query = query.filter(DynamicComponent.parent_id == parent_id)
        
        results = query.order_by(DynamicComponent.order).all()
        
        # 3. Set Cache (TTL 5 mins)
        # Serialize to dict for JSON storage
        serialized_results = [
            {
                "id": c.id, "type": c.type, "content": c.content, 
                "props": c.props, "style": c.style, 
                "parent_id": c.parent_id, "order": c.order,
                "created_at": c.created_at.isoformat(), "created_by": c.created_by
            } for c in results
        ]
        set_cache(cache_key, serialized_results, ttl=300)
        
        return results
    except Exception as e:
        print(f"Error fetching dynamic components: {e}")
        return []

@router.delete("/components/{component_id}")
def delete_component(
    component_id: int,
    db: Session = Depends(get_db),
    admin: dict = Depends(verify_admin)
):
    """Delete a component (Admin only)"""
    component = db.query(DynamicComponent).filter(DynamicComponent.id == component_id).first()
    if not component:
        raise HTTPException(status_code=404, detail="Component not found")
    
    # Invalidate cache (we need parent_id of deleted component)
    parent_id = component.parent_id
    
    db.delete(component)
    db.commit()
    
    delete_cache(f"components:{parent_id}")
    
    return {"message": "Component deleted successfully"}

@router.put("/components/{component_id}", response_model=ComponentResponse)
def update_component(
    component_id: int,
    component_update: ComponentCreate,
    db: Session = Depends(get_db),
    admin: dict = Depends(verify_admin)
):
    """Update a component (Admin only)"""
    component = db.query(DynamicComponent).filter(DynamicComponent.id == component_id).first()
    if not component:
        raise HTTPException(status_code=404, detail="Component not found")
    
    component.type = component_update.type
    component.content = component_update.content
    component.props = component_update.props # type: ignore
    component.style = component_update.style # type: ignore
    component.parent_id = component_update.parent_id
    component.order = component_update.order
    
    db.commit()
    db.refresh(component)
    
    # Invalidate old and new parent cache just in case
    delete_cache(f"components:{component.parent_id}")
    if component.parent_id != component_update.parent_id:
         delete_cache(f"components:{component_update.parent_id}")

    return component
