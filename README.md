
# Regulatory Oversight Management



## Development Guidance

### Solutions
__Do__ Always use Solutions, they should be segmented and relevant to what’s contained in them.  
__Do__ create components (entities, options sets, forms, views, etc...) in a desired solution.   

__DO NOT__ create components (entities, options sets, forms, views, etc...) outside of a solution.    
  > Why? Makes it easier to transfer customizations to other environments like QA and PROD and allows the ability to manage it in source control also helps to avoid dependencies issue when pushing to other environments.

### Adding existing Entities into a Solution.
__Do__ only bring only the relevant fields on an entity when brining into a solution  

__DO NOT__ include 'all components' or 'include entity metadata' when adding existing entity.  
  > Why? Helps to reduce dependencies and keep track of changes.

### Forms

__Do__ create your own custom/copy of "standard" form or view to keep the default as originals when making form changes.  

__DO NOT__ customize the Standard/default forms.  
  > Why? Allows to have a reference to an original copy and avoids cascading changes.
  
## Additional Resources
- [MS Power Platform Application Lifecycle Management Video](https://www.youtube.com/watch?v=xwCUJmrRI9E&t=1159s) In this session, you'll learn how to use Solutions and Azure DevOps to ensure your apps are protected in source control and your apps can be automatically deployed to other environments like test and production
