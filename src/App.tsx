import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { Button } from './components/ui/button';
import { Select } from './components/ui/select';
import { Checkbox } from './components/ui/checkbox';
import { ChevronDown, ChevronUp, Plus, Trash2, Save } from 'lucide-react';

type FormValues = any;

// Mock Data for Dropdowns (In production, these would be fetched from an API or configuration files)
const MOCK_CLIENTS = [
  { id: 'client-a', name: 'Client A (Acme Corp)', dns: '10.1.0.4, 10.1.0.5' },
  { id: 'client-b', name: 'Client B (Globex)', dns: '192.168.100.4, 192.168.100.5' },
  { id: 'client-c', name: 'Client C (Initech)', dns: '172.16.0.4, 172.16.0.5' },
];

const MOCK_SUBNETS = [
  { id: '/subscriptions/.../subnets/snet-application', name: 'Application Subnet (10.0.1.0/24)' },
  { id: '/subscriptions/.../subnets/snet-database', name: 'Database Subnet (10.0.2.0/24)' },
  { id: '/subscriptions/.../subnets/snet-dmz', name: 'DMZ Subnet (10.0.3.0/24)' },
];

const MOCK_RESOURCE_GROUPS = [
  { id: 'application', name: 'Application (rg-App-Application-prd-01)' },
  { id: 'database', name: 'Database (rg-App-DB-prd-01)' },
  { id: 'network', name: 'Network (rg-App-Network-prd-01)' },
];

const SEVERITY_GROUPS = ['Low', 'Medium', 'High', 'Critical'];

function Section({ title, children, defaultOpen = false }: { title: string, children: React.ReactNode, defaultOpen?: boolean }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="border border-slate-200 rounded-lg mb-6 bg-white shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors border-b border-slate-200"
      >
        <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
        {isOpen ? <ChevronUp className="w-5 h-5 text-slate-500" /> : <ChevronDown className="w-5 h-5 text-slate-500" />}
      </button>
      {isOpen && <div className="p-6 space-y-6">{children}</div>}
    </div>
  );
}

function Field({ label, description, children, error }: { label: string, description?: string, children: React.ReactNode, error?: string }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-slate-700 font-medium">{label}</Label>
      {description && <p className="text-xs text-slate-500">{description}</p>}
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

export default function App() {
  const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      client_id: '',
      resource_group_name: 'application',
      severity_group: 'Medium',
      update_allowed: true,
      admin_password: '',
      virtual_machine_config: {
        hostname: '',
        size: '',
        location: '',
        os_sku: '',
        os_publisher: 'MicrosoftWindowsServer',
        os_offer: 'WindowsServer',
        os_version: 'latest',
        os_disk_caching: 'ReadWrite',
        os_disk_storage_type: 'StandardSSD_LRS',
        os_disk_write_accelerator_enabled: false,
        // Hidden defaults
        admin_username: 'loc_sysadmin',
        timezone: 'UTC',
        patch_assessment_mode: 'AutomaticByPlatform',
        patch_mode: 'AutomaticByPlatform',
        vtpm_enabled: true,
        secure_boot_enabled: true,
        bypass_platform_safety_checks_on_user_schedule_enabled: true,
        provision_vm_agent: true,
        allow_extension_operations: true,
        enable_automatic_updates: true,
        additional_capabilities: {
          ultra_ssd_enabled: false,
          hibernation_enabled: false,
        },
        boot_diagnostics: {}
      },
      subnet: {
        id: '',
      },
      nic_config: {
        private_ip: '',
        dns_servers: '',
        enable_accelerated_networking: false,
      },
      data_disks: [],
    }
  });

  const { fields: dataDisks, append: appendDataDisk, remove: removeDataDisk } = useFieldArray({
    control,
    name: "data_disks"
  });

  const clientId = watch("client_id");

  // Auto-fill DNS servers based on selected client
  useEffect(() => {
    const client = MOCK_CLIENTS.find(c => c.id === clientId);
    if (client) {
      setValue("nic_config.dns_servers", client.dns);
    } else {
      setValue("nic_config.dns_servers", "");
    }
  }, [clientId, setValue]);

  const onSubmit = (data: any) => {
    const transformedData = { ...data };
    
    // Transform data_disks array to map, auto-assigning LUN and create_option
    if (data.data_disks && data.data_disks.length > 0) {
      const disksMap: Record<string, any> = {};
      data.data_disks.forEach((disk: any, index: number) => {
        const { logical_name, ...rest } = disk;
        if (logical_name) {
          disksMap[logical_name] = {
            ...rest,
            lun: index, // Auto-assign LUN starting from 0
            create_option: 'Empty' // Always Empty
          };
        }
      });
      transformedData.data_disks = disksMap;
    } else {
      transformedData.data_disks = {};
    }

    // Remove client_id as it's only used for the form UI
    delete transformedData.client_id;

    console.log("Form Submitted:", JSON.stringify(transformedData, null, 2));
    alert("Form submitted! Check console for JSON output.");
  };

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Azure Virtual Machine Configuration</h1>
          <p className="mt-2 text-slate-600">Configure your Azure VM deployment parameters based on the Terraform module specifications.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          
          {/* Client Selection (Top Level) */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 mb-6">
            <Field label="Select Client Context" description="In production, this could be auto-filled via SSO. It determines default configurations like DNS servers." error={errors.client_id?.message as string}>
              <Select {...register("client_id", { required: "Please select a client" })}>
                <option value="">-- Select a Client --</option>
                {MOCK_CLIENTS.map(client => (
                  <option key={client.id} value={client.id}>{client.name}</option>
                ))}
              </Select>
            </Field>
          </div>

          <Section title="General Settings" defaultOpen>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field label="Resource Group" error={errors.resource_group_name?.message as string}>
                <Select {...register("resource_group_name", { required: "Required" })}>
                  {MOCK_RESOURCE_GROUPS.map(rg => (
                    <option key={rg.id} value={rg.id}>{rg.name}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Severity Group" error={errors.severity_group?.message as string}>
                <Select {...register("severity_group", { required: "Required" })}>
                  {SEVERITY_GROUPS.map(sg => (
                    <option key={sg} value={sg}>{sg}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Admin Password" error={errors.admin_password?.message as string}>
                <Input type="password" {...register("admin_password", { required: "Required" })} placeholder="••••••••" />
              </Field>
              <div className="flex flex-col justify-center space-y-4 pt-6">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <Checkbox {...register("update_allowed")} />
                  <span className="text-sm font-medium text-slate-700">Update Allowed</span>
                </label>
              </div>
            </div>
          </Section>

          <Section title="Virtual Machine Configuration">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field label="Hostname" error={errors.virtual_machine_config?.hostname?.message as string}>
                <Input {...register("virtual_machine_config.hostname", { required: "Required" })} placeholder="vm-app-01" />
              </Field>
              <Field label="Size" error={errors.virtual_machine_config?.size?.message as string}>
                <Input {...register("virtual_machine_config.size", { required: "Required" })} placeholder="Standard_D2s_v3" />
              </Field>
              <Field label="Location" error={errors.virtual_machine_config?.location?.message as string}>
                <Input {...register("virtual_machine_config.location", { required: "Required" })} placeholder="westeurope" />
              </Field>
              <Field label="OS SKU" error={errors.virtual_machine_config?.os_sku?.message as string}>
                <Input {...register("virtual_machine_config.os_sku", { required: "Required" })} placeholder="2022-datacenter-azure-edition" />
              </Field>
              
              <Field label="OS Publisher">
                <Input {...register("virtual_machine_config.os_publisher")} />
              </Field>
              <Field label="OS Offer">
                <Input {...register("virtual_machine_config.os_offer")} />
              </Field>
              <Field label="OS Version">
                <Input {...register("virtual_machine_config.os_version")} />
              </Field>
              <Field label="Availability Zone">
                <Select {...register("virtual_machine_config.zone")}>
                  <option value="">None</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                </Select>
              </Field>
              
              <Field label="OS Disk Caching">
                <Select {...register("virtual_machine_config.os_disk_caching")}>
                  <option value="None">None</option>
                  <option value="ReadOnly">ReadOnly</option>
                  <option value="ReadWrite">ReadWrite</option>
                </Select>
              </Field>
              <Field label="OS Disk Storage Type">
                <Select {...register("virtual_machine_config.os_disk_storage_type")}>
                  <option value="Standard_LRS">Standard_LRS</option>
                  <option value="StandardSSD_LRS">StandardSSD_LRS</option>
                  <option value="Premium_LRS">Premium_LRS</option>
                  <option value="StandardSSD_ZRS">StandardSSD_ZRS</option>
                  <option value="Premium_ZRS">Premium_ZRS</option>
                </Select>
              </Field>
              <Field label="OS Disk Size (GB)">
                <Input type="number" {...register("virtual_machine_config.os_disk_size_gb", { valueAsNumber: true })} placeholder="128" />
              </Field>

              <div className="col-span-1 md:col-span-2 pt-4 border-t border-slate-100">
                <details className="group">
                  <summary className="flex items-center cursor-pointer text-sm font-medium text-slate-700 hover:text-slate-900 list-none">
                    <ChevronDown className="w-4 h-4 mr-1 transition-transform group-open:-rotate-180" />
                    Advanced Settings
                  </summary>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-4 mt-2">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <Checkbox {...register("virtual_machine_config.os_disk_write_accelerator_enabled")} />
                      <span className="text-sm text-slate-700">OS Disk Write Accelerator</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <Checkbox {...register("virtual_machine_config.vtpm_enabled")} />
                      <span className="text-sm text-slate-700">vTPM Enabled</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <Checkbox {...register("virtual_machine_config.secure_boot_enabled")} />
                      <span className="text-sm text-slate-700">Secure Boot Enabled</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <Checkbox {...register("virtual_machine_config.provision_vm_agent")} />
                      <span className="text-sm text-slate-700">Provision VM Agent</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <Checkbox {...register("virtual_machine_config.allow_extension_operations")} />
                      <span className="text-sm text-slate-700">Allow Extension Operations</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <Checkbox {...register("virtual_machine_config.enable_automatic_updates")} />
                      <span className="text-sm text-slate-700">Enable Automatic Updates</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <Checkbox {...register("virtual_machine_config.additional_capabilities.ultra_ssd_enabled")} />
                      <span className="text-sm text-slate-700">Ultra SSD Enabled</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <Checkbox {...register("virtual_machine_config.additional_capabilities.hibernation_enabled")} />
                      <span className="text-sm text-slate-700">Hibernation Enabled</span>
                    </label>
                  </div>
                </details>
              </div>

            </div>
          </Section>

          <Section title="Network Configuration">
            <div className="space-y-6">
              <div className="bg-slate-50 p-4 rounded-md border border-slate-200">
                <h3 className="text-md font-medium text-slate-800 mb-4">Subnet</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Field label="Subnet" error={errors.subnet?.id?.message as string}>
                    <Select {...register("subnet.id", { required: "Required" })}>
                      <option value="">-- Select Subnet --</option>
                      {MOCK_SUBNETS.map(subnet => (
                        <option key={subnet.id} value={subnet.id}>{subnet.name}</option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Address Prefixes (comma separated)">
                    <Input {...register("subnet.address_prefixes")} placeholder="10.0.0.0/24" />
                  </Field>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-md border border-slate-200">
                <h3 className="text-md font-medium text-slate-800 mb-4">Network Interface (NIC)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Field label="Private IP">
                    <Input {...register("nic_config.private_ip")} placeholder="10.0.0.4" />
                  </Field>
                  <Field label="DNS Servers (Auto-filled by Client)" description="Read-only. Managed by client selection.">
                    <Input {...register("nic_config.dns_servers")} readOnly className="bg-slate-100 text-slate-500 cursor-not-allowed" />
                  </Field>
                  <div className="col-span-1 md:col-span-2">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <Checkbox {...register("nic_config.enable_accelerated_networking")} />
                      <span className="text-sm text-slate-700">Enable Accelerated Networking</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </Section>

          <Section title="Data Disks">
            <div className="space-y-4">
              {dataDisks.map((field, index) => (
                <div key={field.id} className="relative bg-slate-50 p-5 rounded-md border border-slate-200">
                  <button 
                    type="button" 
                    onClick={() => removeDataDisk(index)}
                    className="absolute top-4 right-4 text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                  
                  <div className="flex items-center mb-4">
                    <h4 className="text-sm font-semibold text-slate-800">Disk {index + 1}</h4>
                    <span className="ml-3 px-2 py-0.5 rounded-full bg-slate-200 text-xs font-medium text-slate-600">
                      LUN: {index}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Field label="Logical Name (Key)">
                      <Input {...register(`data_disks.${index}.logical_name` as const, { required: true })} placeholder="disk1" />
                    </Field>
                    <Field label="Size (GB)">
                      <Input type="number" {...register(`data_disks.${index}.disk_size_gb` as const, { valueAsNumber: true, required: true })} placeholder="128" />
                    </Field>
                    
                    <Field label="Storage Account Type">
                      <Select {...register(`data_disks.${index}.storage_account_type` as const)}>
                        <option value="StandardSSD_LRS">StandardSSD_LRS</option>
                        <option value="Standard_LRS">Standard_LRS</option>
                        <option value="Premium_LRS">Premium_LRS</option>
                        <option value="StandardSSD_ZRS">StandardSSD_ZRS</option>
                        <option value="Premium_ZRS">Premium_ZRS</option>
                        <option value="PremiumV2_LRS">PremiumV2_LRS</option>
                        <option value="UltraSSD_LRS">UltraSSD_LRS</option>
                      </Select>
                    </Field>
                    <Field label="Caching">
                      <Select {...register(`data_disks.${index}.caching` as const)}>
                        <option value="ReadWrite">ReadWrite</option>
                        <option value="ReadOnly">ReadOnly</option>
                        <option value="None">None</option>
                      </Select>
                    </Field>
                    <Field label="Max Shares">
                      <Input type="number" {...register(`data_disks.${index}.max_shares` as const, { valueAsNumber: true })} placeholder="1" />
                    </Field>
                  </div>
                  
                  <div className="flex flex-wrap gap-4 mt-4">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <Checkbox {...register(`data_disks.${index}.write_accelerator_enabled` as const)} />
                      <span className="text-sm text-slate-700">Write Accelerator</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <Checkbox {...register(`data_disks.${index}.on_demand_bursting_enabled` as const)} />
                      <span className="text-sm text-slate-700">On-Demand Bursting</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <Checkbox {...register(`data_disks.${index}.trusted_launch_enabled` as const)} />
                      <span className="text-sm text-slate-700">Trusted Launch</span>
                    </label>
                  </div>
                </div>
              ))}
              
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => appendDataDisk({ 
                  logical_name: `disk${dataDisks.length + 1}`,
                  disk_size_gb: 128, 
                  storage_account_type: 'StandardSSD_LRS',
                  caching: 'ReadWrite',
                  write_accelerator_enabled: false,
                  on_demand_bursting_enabled: false
                })}
                className="w-full border-dashed border-2 text-slate-600 hover:text-slate-900 hover:border-slate-400"
              >
                <Plus className="w-4 h-4 mr-2" /> Add Data Disk
              </Button>
            </div>
          </Section>

          <div className="sticky bottom-0 bg-slate-100 py-4 border-t border-slate-200 flex justify-end z-10">
            <Button type="submit" className="w-full sm:w-auto text-base px-8 py-6 shadow-lg">
              <Save className="w-5 h-5 mr-2" />
              Generate Configuration
            </Button>
          </div>

        </form>
      </div>
    </div>
  );
}

