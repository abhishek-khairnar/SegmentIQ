from typing import Dict, Any, List, Tuple
import numpy as np

def humanize_feature_name(feat: str) -> str:
    name = feat.replace("_", " ").strip()
    replacements = {
        "recency days": "recency",
        "avg order value": "order value",
        "annual income k": "annual income",
        "spending score": "spending score",
        "visits per month": "monthly visits"
    }
    return replacements.get(name.lower(), name.capitalize())

def generate_segment_name_and_actions(
    segment_idx: int,
    z_scores: Dict[str, float],
    feature_means: Dict[str, float],
    overall_means: Dict[str, float],
    existing_names: List[str]
) -> Tuple[str, str, List[str]]:
    """
    Auto-names a cluster segment based on highest absolute z-scores and suggests 3 tailored marketing actions.
    """
    sorted_traits = sorted(z_scores.items(), key=lambda item: abs(item[1]), reverse=True)
    
    # Check for RFM-like feature names
    lower_traits = {k.lower(): (k, v) for k, v in z_scores.items()}
    r_key = next((k for k in lower_traits if "recency" in k), None)
    f_key = next((k for k in lower_traits if "freq" in k or "orders" in k), None)
    m_key = next((k for k in lower_traits if "monetary" in k or "spend" in k or "amount" in k), None)

    suggested_name = None

    if r_key and f_key and m_key:
        r_z = lower_traits[r_key][1]
        f_z = lower_traits[f_key][1]
        m_z = lower_traits[m_key][1]

        if m_z > 0.5 and f_z > 0.5 and r_z < 0:
            suggested_name = "High-value regulars"
        elif r_z > 0.5 and f_z < -0.3:
            suggested_name = "Lapsed low-spenders"
        elif r_z < -0.3 and f_z < -0.3:
            suggested_name = "Recent newcomers"

    if not suggested_name:
        # Fall back to top 1 or 2 traits by absolute z-score
        if len(sorted_traits) >= 2:
            feat1, z1 = sorted_traits[0]
            feat2, z2 = sorted_traits[1]
            desc1 = "High" if z1 >= 0 else "Low"
            desc2 = "High" if z2 >= 0 else "Low"
            suggested_name = f"{desc1} {humanize_feature_name(feat1)} / {desc2} {humanize_feature_name(feat2)}"
        elif len(sorted_traits) == 1:
            feat1, z1 = sorted_traits[0]
            desc1 = "High" if z1 >= 0 else "Low"
            suggested_name = f"{desc1} {humanize_feature_name(feat1)}"
        else:
            suggested_name = f"Cluster {segment_idx + 1}"

    # Ensure uniqueness
    unique_name = suggested_name
    letter_code = chr(65 + segment_idx)
    if unique_name in existing_names:
        unique_name = f"{suggested_name} ({letter_code})"

    # Generate 1-sentence description
    traits_desc = []
    for feat, z in sorted_traits[:3]:
        h_name = humanize_feature_name(feat)
        if z >= 1.0:
            traits_desc.append(f"substantially higher {h_name}")
        elif z > 0.3:
            traits_desc.append(f"above-average {h_name}")
        elif z <= -1.0:
            traits_desc.append(f"significantly lower {h_name}")
        elif z < -0.3:
            traits_desc.append(f"below-average {h_name}")
        else:
            traits_desc.append(f"typical {h_name}")

    description = f"Customers characterized by {', '.join(traits_desc)} relative to the overall customer base."

    # Generate 3 recommended actions based on traits
    actions = []
    # Primary trait action
    if sorted_traits:
        top_feat, top_z = sorted_traits[0]
        top_name = humanize_feature_name(top_feat)
        if "spend" in top_name.lower() or "income" in top_name.lower() or "monetary" in top_name.lower():
            if top_z > 0:
                actions.append("Introduce VIP tier and invite into premium loyalty club")
            else:
                actions.append("Promote entry-level product bundles and price-sensitive promotions")
        elif "recency" in top_name.lower():
            if top_z > 0:
                actions.append("Send urgent win-back reactivations and survey lapsed intent")
            else:
                actions.append("Deliver warm onboarding sequence to maintain active momentum")
        elif "freq" in top_name.lower() or "visit" in top_name.lower():
            if top_z > 0:
                actions.append("Incentivize cross-category product discovery and subscription options")
            else:
                actions.append("Trigger re-engagement reminders to boost order frequency")
        else:
            if top_z > 0:
                actions.append(f"Tailor campaigns highlighting advantages in {top_name}")
            else:
                actions.append(f"Provide lower-barrier incentives to elevate {top_name}")

    # Secondary trait action
    if len(sorted_traits) > 1:
        s_feat, s_z = sorted_traits[1]
        s_name = humanize_feature_name(s_feat)
        if s_z > 0:
            actions.append(f"Leverage strong {s_name} with tailored category recommendations")
        else:
            actions.append(f"Run targeted experiments to improve {s_name} responsiveness")

    # General third action
    default_actions = [
        "A/B test personalized messaging frequency against this segment",
        "Monitor segment retention cohorts every 30 days",
        "Optimize marketing spend by suppressing unresponsive channels"
    ]
    for da in default_actions:
        if len(actions) < 3 and da not in actions:
            actions.append(da)

    return unique_name, description, actions[:3]
