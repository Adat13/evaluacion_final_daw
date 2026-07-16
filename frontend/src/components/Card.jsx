import React from 'react'
import './Card.css'

export const Card = ({ title, icon, children, className = '' }) => {
  return (
    <div className={`card ${className}`}>
      {(title || icon) && (
        <div className="card-header">
          <h3 className="card-title">
            {icon && <i className={`fas fa-${icon}`}></i>}
            {title}
          </h3>
        </div>
      )}
      <div className="card-content">{children}</div>
    </div>
  )
}

export const StatCard = ({ title, value, icon, iconColor, subtext }) => {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${iconColor}`}>
        <i className={`fas fa-${icon}`}></i>
      </div>
      <div className="stat-details">
        <h3>{title}</h3>
        <div className="value">{value}</div>
        {subtext && <div className="subtext">{subtext}</div>}
      </div>
    </div>
  )
}
