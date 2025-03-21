module "gke" {
  source                     = "terraform-google-modules/kubernetes-engine/google"
  project_id                 = var.gcp_project_id
  name                       = var.gke_cluster_name
  regional                   = var.gke_regional
  region                     = var.gcp_region
  zones                      = var.gke_zones_list
  network                    = var.gke_vpc
  subnetwork                 = var.gke_subnet
  ip_range_pods              = ""
  ip_range_services          = ""
  http_load_balancing        = false
  network_policy             = false
  horizontal_pod_autoscaling = true
  filestore_csi_driver       = false
  dns_cache                  = false
  deletion_protection        = false

  node_pools = [
    {
      name                        = var.gke_node_pools_name
      machine_type                = "e2-medium"
      min_count                   = 1
      max_count                   = 3
      local_ssd_count             = 0
      spot                        = true
      disk_size_gb                = 200
      disk_type                   = "pd-standard"
      image_type                  = "COS_CONTAINERD"
      enable_gcfs                 = false
      enable_gvnic                = false
      logging_variant             = "DEFAULT"
      auto_repair                 = true
      auto_upgrade                = true
      service_account             = var.gke_service_account_name
      preemptible                 = false
      initial_node_count          = 1
    },
  ]

  node_pools_oauth_scopes = {
    all = [
      "https://www.googleapis.com/auth/logging.write",
      "https://www.googleapis.com/auth/monitoring",
    ]
  }

  node_pools_labels = {
    all = {}

    default-node-pool = {
      default-node-pool = true
    }
  }

  node_pools_metadata = {
    all = {}

    default-node-pool = {
      node-pool-metadata-custom-value = "my-node-pool"
    }
  }

  node_pools_tags = {
    all = []

    default-node-pool = [
      "default-node-pool",
    ]
  }
}

resource "kubernetes_secret" "artifact_registry" {
  metadata {
    name      = "artifact-registry-secret"
    namespace = "default"
  }

  data = {
    ".dockerconfigjson" = jsonencode({
      auths = {
        "us-central1-docker.pkg.dev" = {
          "username" = "_json_key"
          "password" = file("./studied-alloy-452602-q9-3921c91b71ed.json")
          "email"    = "your-email@example.com"
          "auth"     = base64encode(format("_json_key:%s", file("./studied-alloy-452602-q9-3921c91b71ed.json")))
        }
      }
    })
  }

  type = "kubernetes.io/dockerconfigjson"
}
  # node_pools_taints = {
  #   all = []

  #   default-node-pool = [
  #     {
  #       key    = "default-node-pool"
  #       value  = true
  #       effect = "PREFER_NO_SCHEDULE"
  #     },
  #   ]
  # }